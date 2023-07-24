build:
	docker build -t askbot .

run:
	docker run -d -p 3000:3000 --name askbot --rm askbot