#!/bin/sh

echo "Applying database migrations..."
python manage.py migrate

if [ "$1" = "run_server" ]; then
    echo "Starting server..."
    daphne -b 0.0.0.0 -p 8000 wordle_project.asgi:application
else
    exec "$@"
fi