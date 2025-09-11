FROM python:3.9-slim
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN addgroup --system appuser && adduser --system --ingroup appuser appuser

COPY . .
RUN sed -i 's/\r$//' /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh
RUN chown -R appuser:appuser /app

USER appuser
ENTRYPOINT ["/app/entrypoint.sh"]

CMD ["run_server"]