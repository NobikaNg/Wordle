# Wordle

This repository is an online wordle game, which support 2-player wordle guessing game.

It related to the task 1, 2 and 4 of the technical test.

## How to Start

It is recommened that to use `docker` to run the program to prevent the version problem.

Therefore, please ensure your machine have installed `docker` before using this program.

- Step 1:

Enter the dir of `Wordle` and build the docker containers.

```
docker-compose up --build -d
```

- Step 2:

  After the docker containers building finish, you can navigate to `http://localhost:3000/` and play the Wordle Game.

## Front End

Framework: React

TODO:

1. Room Selection
2. Interactive Game

## Back End

Framework: Django

TODO:

1. Provide Take Turns Logic
2. Web Socket
