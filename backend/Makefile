deploy:
	@./node_modules/.bin/truffle migrate

deploy-test:
	@./node_modules/.bin/truffle migrate --network rinkeby --reset

deploy-main:
	@./node_modules/.bin/truffle migrate --network main --reset

test:
	@./node_modules/.bin/truffle test

verify:
	@./node_modules/.bin/truffle run verify

.PHONY: deploy \
		deploy-test \
		deploy-main \
		test \
		verify

