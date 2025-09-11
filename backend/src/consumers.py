import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import GameRoom, Player
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken, InvalidToken
from collections import Counter

class WordleConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_string = self.scope['query_string'].decode()
        params = dict(p.split('=') for p in query_string.split('&') if '=' in p)
        token = params.get('token')

        if not token:
            await self.close()
            return

        try:
            access_token = AccessToken(token)
            self.scope['user'] = await self.get_player(access_token['username'])
        except (InvalidToken, Player.DoesNotExist):
            await self.close()
            return

        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'wordle_{self.room_id}'
        self.username = self.scope['user'].username

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        
        await self.player_joins()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data['type'] == 'make_guess':
            await self.handle_guess(data['guess'])

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
        
        game_state_update = {}
        if guess == ans_word:
            room.game_state = 'finished'
            room.winner = self.username
            game_state_update = {'type': 'game_over', 'winner': self.username}
        elif room.turn_number >= room.max_turns * 2: 
            room.game_state = 'finished'
            room.winner = 'draw'
            game_state_update = {'type': 'game_over', 'winner': 'draw'}
        else:
            room.current_turn_player_index = (room.current_turn_player_index + 1) % len(room.players)
            game_state_update = {'type': 'game_update'}

        await database_sync_to_async(room.save)()

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'broadcast_game_state',
                'game_state': await self.get_game_state_json(room)
            }
        )

    @database_sync_to_async
    def get_player(self, username):
        return Player.objects.get(username=username)