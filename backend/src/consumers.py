import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import GameRoom, Player
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken
from collections import Counter
import logging
from django.core.cache import cache

class WordleConsumer(AsyncWebsocketConsumer):
    async def connect(self):

        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'wordle_{self.room_id}'

        try:
            query_string = self.scope['query_string'].decode()
            params = dict(p.split('=') for p in query_string.split('&'))
            
            token = params.get('token')
            if not token:
                await self.close()
                return

            access_token = AccessToken(token)            
            user_identifier = access_token['user_id']       
            self.scope['user'] = await self.get_player(user_identifier)
            self.username = self.scope['user'].username

            cache_key = f"user_channel_{self.username}_{self.room_id}"
            old_channel_name = cache.get(cache_key)

            # Prevent duplicated connection for a same user
            if old_channel_name:
                logging.info(f"Found old connection for user '{self.username}'. Closing it.")
                await self.channel_layer.send(
                    old_channel_name,
                    {
                        "type": "force_disconnect",
                        "message": "You have connected from another location."
                    }
                )
            
            cache.set(cache_key, self.channel_name, timeout=3600)

            room = await database_sync_to_async(GameRoom.objects.get)(room_id=self.room_id)
            if self.username not in room.players and (room.is_full() or room.game_state == 'playing'):
                await self.close(code=4002) 
                return

        except (InvalidToken, Player.DoesNotExist):
            await self.close()
            return
        except GameRoom.DoesNotExist:
            await self.close(code=4004)
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        
        await self.player_joins(room)

    async def player_joins(self, room):
        logging.info(f"Player '{self.username}' connected to room '{self.room_id}'.")

        room = await database_sync_to_async(GameRoom.objects.get)(room_id=self.room_id)
        if self.username not in room.players:
            room.players.append(self.username)
            await database_sync_to_async(room.save)()
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'player_join_notification',
                'username': self.username
            }
        )

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'broadcast_game_state',
                'game_state': await self.get_game_state_json(room)
            }
        )

    async def disconnect(self, close_code):
        if hasattr(self, 'username'):
            cache_key = f"user_channel_{self.username}_{self.room_id}"
            if cache.get(cache_key) == self.channel_name:
                cache.delete(cache_key)
            await self.player_leaves()
        
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    # Force interruption
    async def force_disconnect(self, event):
        """
        Handler for the force_disconnect message.
        Closes the WebSocket connection with a specific code.
        """
        logging.info(f"Forcefully disconnecting {self.channel_name} due to new connection.")
        await self.close(code=4000) # 4000 mean replace the old channel

    async def player_leaves(self):
        logging.info(f"Player '{self.username}' leave from the room '{self.room_id}'")
        try:
            room = await database_sync_to_async(GameRoom.objects.get)(room_id=self.room_id)
        except GameRoom.DoesNotExist:
            logging.warning(f"Room '{self.room_id}' not found when player '{self.username}' tried to leave.")
            return

        if self.username in room.players:
            is_playing = room.game_state == 'playing'
            leaver = self.username
            room.players.remove(leaver)
            
            if not room.players:
                await database_sync_to_async(room.delete)()
                logging.info(f"Room '{self.room_id}' is empty and has been deleted.")
                return

            if is_playing:
                winner = room.players[0]    # the left player will win the game
                await database_sync_to_async(room.reset_game)(aborted=True, winner=winner)
                logging.info(f"Game in room '{self.room_id}' aborted due to player leaving.")
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'game_aborted_notification',
                        'leaver': leaver,
                        'message': f'Player {leaver} left. {winner} wins by default. Game has been reset.'
                    }
                )
            else:
                await database_sync_to_async(room.save)()

        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type':'player_leave_notification',
                'username': leaver
            }
        )

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'broadcast_game_state',
                'game_state': await self.get_game_state_json(room)
            }
            )
    
    async def player_join_notification(self, event):
        await self.send(text_data=json.dumps({
            'type': 'player_join',
            'username': event['username']
        }))

    async def player_leave_notification(self, event):
        await self.send(text_data=json.dumps({
            'type': 'player_leave',
            'username': event['username']
        }))

    async def game_aborted_notification(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_aborted',
            'leaver': event['leaver'],
            'message': event['message']
        }))

    async def receive(self, text_data):

        data = json.loads(text_data)
        action_type = data.get('type')

        if action_type == 'make_guess':
            await self.handle_guess(data['guess'])
        elif action_type == 'leave_room':
            await self.close()
        elif action_type == 'start_game':
            await self.handle_start_game()
        elif action_type == 'replay_game':
            await self.handle_replay_game()
    
    async def handle_start_game(self):
        room = await database_sync_to_async(GameRoom.objects.get)(room_id=self.room_id)

        if room.host == self.username and room.is_full() and room.game_state == 'waiting':
            await database_sync_to_async(room.reset_game)()
            room.game_state = 'playing'
            room.winner = None 
            await database_sync_to_async(room.save)()

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'broadcast_game_state',
                    'game_state': await self.get_game_state_json(room)
                }
            )
    
    async def handle_replay_game(self):
        # This is an alias for handle_start_game, for clarity
        room = await database_sync_to_async(GameRoom.objects.get)(room_id=self.room_id)
        if room.host == self.username and room.game_state == 'waiting' and room.is_full() :
            await database_sync_to_async(room.reset_game)()
            room.game_state = 'playing'
            await database_sync_to_async(room.save)()

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'broadcast_game_state',
                    'game_state': await self.get_game_state_json(room)
                }
            )

    async def handle_leave_room(self):
        logging.info(f"Player '{self.username}' requested to leave room '{self.room_id}'.")
        await self.close()

    async def handle_guess(self, guess):
        room = await database_sync_to_async(GameRoom.objects.get)(room_id=self.room_id)
        
        current_player_username = room.players[room.current_turn_player_index]
        if self.username != current_player_username:
            await self.send(text_data=json.dumps({'type': 'error', 'message': 'Not your turn!'}))
            return

        guess = guess.lower()
        ans_word = room.answer_word.lower()

        ans_chars = list(ans_word)
        guess_chars = list(guess)
        ans_count = Counter(ans_chars)
        statuses = ['miss'] * len(ans_word)
        detailed_result = []

        for i in range(len(ans_word)):
            if guess_chars[i] == ans_chars[i]:
                statuses[i] = 'hit'
                ans_count[guess_chars[i]] -= 1

        for i in range(len(ans_word)):
            if statuses[i] == 'miss' and guess_chars[i] in ans_count and ans_count[guess_chars[i]] > 0:
                statuses[i] = 'present'
                ans_count[guess_chars[i]] -= 1
        
        for i, char in enumerate(guess_chars):
            detailed_result.append({'char': char, 'status': statuses[i]})
        room.history.append({
            'player': self.username,
            'guess': guess,
            'result': detailed_result
        })
        room.turn_number += 1
        
        game_over = False
        winner = None
        if guess == ans_word:
            game_over = True
            winner = self.username
        elif room.turn_number >= room.max_turns * len(room.players): 
            game_over = True
            winner = 'draw'
        
        if game_over:
            room.game_state = 'waiting'
            room.winner = winner
            await database_sync_to_async(room.save)()
        else:
            room.current_turn_player_index = (room.current_turn_player_index + 1) % len(room.players)
            await database_sync_to_async(room.save)()

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'broadcast_game_state',
                'game_state': await self.get_game_state_json(room)
            }
        )

    async def broadcast_game_state(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_state_update',
            'game_state': event['game_state']
        }))

    @database_sync_to_async
    def get_game_state_json(self, room):
        answer = None
        if room.game_state == 'waiting' and room.winner is not None:
            answer = room.answer_word.upper()
        return {
            'players': room.players,
            'history': room.history,
            'current_turn_player_index': room.current_turn_player_index,
            'game_state': room.game_state,
            'winner': room.winner,
            'host': room.host,
            'is_full': room.is_full(),
        }

    @database_sync_to_async
    def get_player(self, username):
        return Player.objects.get(username=username)