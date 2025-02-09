FROM python:3.8-slim-buster

WORKDIR /python-docker

RUN pip3 install flask 
RUN pip3 install flask_cors

COPY . .
EXPOSE 5000

CMD [ "python3", "-m" , "flask", "run", "--host=0.0.0.0"]
