import logging
import random
from collections import Counter

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s", 
)

def wordle():
    logging.info('Wordle Game Start')

    try:
        with open('configuration.txt', "r", encoding='utf-8') as file:
            lines = [line.strip() for line in file if line.strip()]
        
        if lines[0].startswith("max_turn="):
            Max_turn = int(lines[0].split("=")[1])
            ans_list = lines[1:]
    except Exception as e:
        logging.error("Fail to extract the information from configuration.txt")
        return

    ans = random.choice(ans_list)
    ans_chars = list(ans)

    logging.debug(f"The Answer is: {ans}")

    Game_result = "Lose"

    turn_num = 0

    while turn_num < Max_turn:

        while True:
            
            guess = input("Guess a 5-letter words: ")
            if len(guess) == 5 and guess.isalpha():
                break
            else:
                logging.warning("Please enter a 5-letter word!")

        char_list = list(guess)

        logging.info(char_list)

        if guess == ans:
            Game_result = "Win"
            break

        ans_count = Counter(ans_chars)
        result = ['Miss'] * 5

        # Hit checking
        for i in range(5):
            if char_list[i] == ans_chars[i]:
                result[i] = 'Hit'
                ans_count[char_list[i]] -= 1

        for i in range(5):
            if result[i] == 'Miss' and char_list[i] in ans_count and ans_count[char_list[i]] > 0:
                result[i] = 'Present'
                ans_count[char_list[i]] -= 1
        
        for i, char in enumerate(char_list):
            logging.info(f'{char} is {result[i]}')
        
        turn_num+=1
    
    return Game_result


if __name__ == "__main__":
    guess_result = wordle()
    logging.info(f"Guess Result: {guess_result}")