from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import GameRoom
from django.conf import settings
from collections import Counter
import random
import logging

class StartSinglePlayerGameView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            
            word_list = settings.GAME_CONFIG.get('word_list', [])
            max_turns = settings.GAME_CONFIG.get('max_turns', 3)

            if not word_list:
                raise ValueError("Word list is empty or missing in config")

            room = GameRoom.objects.create(
                answer_word=random.choice(word_list),
                max_turns=max_turns,
                players=[request.user.username],
                game_mode='single_player'
            )
            
            logging.info(f"New single-player game room {room.room_id} created for {request.user.username}.")
            return Response({'message': 'New Single Player Game Started', 'room_id': room.room_id}, status=status.HTTP_201_CREATED)

        except Exception as e:
            logging.error(f'Error creating single-player game: {e}')
            return Response({'error': 'Game Initialization Failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SinglePlayerGuessView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_id):
        try:
            room = GameRoom.objects.get(pk=room_id)
        except GameRoom.DoesNotExist:
            return Response({'error': 'Game not found. Please start a new game.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.username not in room.players:
            return Response({'error': 'You are not part of this game.'}, status=status.HTTP_403_FORBIDDEN)
        
        if room.game_state == 'finished':
            return Response({'error': 'This game has already ended.'}, status=status.HTTP_400_BAD_REQUEST)

        guess = request.data.get('guess', '').lower()
        if len(guess) != 5:
            return Response({'error': 'Guess must be 5 letters long.'}, status=status.HTTP_400_BAD_REQUEST)

        ans_word = room.answer_word.lower()
        ans_count = Counter(ans_word)
        
        statuses = ['Miss'] * 5
        detailed_result = []

        # 1st pass: Check for "Hit"
        for i in range(5):
            if guess[i] == ans_word[i]:
                statuses[i] = 'Hit'
                ans_count[guess[i]] -= 1

        # 2nd pass: Check for "Present"
        for i in range(5):
            if statuses[i] == 'Miss' and guess[i] in ans_count and ans_count[guess[i]] > 0:
                statuses[i] = 'Present'
                ans_count[guess[i]] -= 1
        
        for i, char in enumerate(guess):
            detailed_result.append({'char': char.upper(), 'status': statuses[i]})

        room.turn_number += 1
        room.history.append({'guess': guess.upper(), 'result': detailed_result})

        game_result = 'Continue'
        if guess == ans_word:
            game_result = 'Win'
            room.game_state = 'finished'
            room.winner = request.user.username
        elif room.turn_number >= room.max_turns:
            game_result = 'Lose'
            room.game_state = 'finished'
        
        room.save()

        return Response({
            'game_result': game_result,
            'result': detailed_result,
            'turn': room.turn_number,
            'max_turns': room.max_turns,
            'answer': ans_word.upper() if game_result in ['Win', 'Lose'] else None
        })
    
class ReplaySinglePlayerGameView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_id):
        try:
            room = GameRoom.objects.get(pk=room_id, game_mode='single_player')
        except GameRoom.DoesNotExist:
            return Response({'error': 'Game not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.username not in room.players:
            return Response({'error': 'You are not part of this game.'}, status=status.HTTP_403_FORBIDDEN)

        word_list = settings.GAME_CONFIG.get('word_list', [])
        if not word_list:
            return Response({'error': 'Word list configuration is missing.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        room.answer_word = random.choice(word_list)
        room.history = []
        room.turn_number = 0
        room.game_state = 'waiting' 
        room.winner = None
        room.save()

        logging.info(f"Room {room_id} has been reset for a new round by {request.user.username}.")

        initial_state = {
            'players': room.players,
            'host': room.players[0] if room.players else None,
            'history': [],
            'game_state': 'waiting',
            'winner': None,
        }
        return Response(initial_state, status=status.HTTP_200_OK)