FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5050
# --timeout 120: live LLM scoring (strong model + long rubric) can exceed gunicorn's 30s default
CMD ["sh", "-c", "alembic upgrade head && gunicorn -b 0.0.0.0:5050 --timeout 120 --workers 2 wsgi:app"]
