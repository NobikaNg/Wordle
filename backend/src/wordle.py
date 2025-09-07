from django.http import HttpResponse
import logging

def wordle_judgment(request):
    guess = request.GET.get('guess', 'No guess provided')
    logging.info("Request Received")
    logging.debug(f'The Request Guess: {guess}')
    return HttpResponse(f"Your Guess is {guess}")