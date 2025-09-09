from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from collections import Counter
import logging
import yaml
import random
import json
from pathlib import Path

CONFIG = {}
try:
    config_path = Path(__file__).resolve().parent.parent / 'config.yml'
    with open(config_path, "r") as f:
        CONFIG = yaml.safe_load(f)
    logging.info("Game configuration loaded successfully.")
except Exception as e:
    logging.error(f"Fail to load the config file: {e}")

def game_start(request):
    try:
        word_list = CONFIG.get('word_list', ['error'])
        if not word_list or word_list == ['error']:
            raise ValueError("Word list is empty or mising in config")
        
        ans_word = random.choice(word_list)
        
        request.session['ans_word'] = ans_word
        request.session['turn'] = 0

        logging.info(f"New Game Started. Ans: {ans_word}")
        return JsonResponse({'message': 'New Game Started'})
    except Exception as e:
        logging.error(f'Error occur in initialization of game: {e}')
        return JsonResponse({'error': 'Game Initialization Fail'}, status=500)

@csrf_exempt
@require_http_methods(['POST'])
def wordle_judgment(request):
    logging.info("Request Received")
    turn = request.session.get('turn', 0)
    ans_word = request.session.get('ans_word')
    max_turns = CONFIG.get('max_turns', 3)

    if not ans_word:
        logging.warning("Attempted to submit after game ended. Please start a new game.")
        return JsonResponse({'error':'Game is not initialized. Please start a new game'})

    try:
        data = json.loads(request.body)
        guess = data.get('guess', '')
    except json.JSONDecodeError:
        return JsonResponse({'error':'Invalid JSON format'}, status = 400)
    
    guess = guess.lower()
    ans_word = ans_word.lower()

    logging.info(f'Turn: {turn}')
    logging.info(f'The Request Guess: {guess}')
    logging.info(f'Answer: {ans_word}')

    ans_chars = list(ans_word)
    guess_chars = list(guess)
    ans_count = Counter(ans_chars)
    
    statuses = ['Miss'] * len(ans_word)
    detailed_result = []

    # 1st pass: Check for "Hit" (correct character in correct position)
    for i in range(len(ans_word)):
        if guess_chars[i] == ans_chars[i]:
            statuses[i] = 'Hit'
            ans_count[guess_chars[i]] -= 1

    # 2nd pass: Check for "Present" (correct character in wrong position)
    for i in range(len(ans_word)):
        if statuses[i] == 'Miss' and guess_chars[i] in ans_count and ans_count[guess_chars[i]] > 0:
            statuses[i] = 'Present'
            ans_count[guess_chars[i]] -= 1
    
    for i, char in enumerate(guess_chars):
        detailed_result.append({'char': char, 'status': statuses[i]})

    turn += 1
    request.session['turn'] = turn

    if guess == ans_word:
        game_result = 'Win'
        del request.session['ans_word'] # End game
        return JsonResponse({
            'player_id': request.session.session_key,
            'game_result': game_result,
            'result': detailed_result,
            'turn': turn,
            'max_turns': max_turns
        })
    elif turn >= max_turns:
        game_result = 'Lose'
        del request.session['ans_word'] # End game
        return JsonResponse({
            'player_id': request.session.session_key,
            'game_result': game_result,
            'result': detailed_result,
            'turn': turn,
            'max_turns': max_turns
        })
    else:
        game_result = 'Continue'
    
    return JsonResponse({
        'player_id': request.session.session_key,
        'game_result': game_result,
        'result': detailed_result,
        'turn': turn,
        'max_turns': max_turns
    })