run:
	@mkdir -p src/data/contracts
	@rm -rf src/data/contracts
	@cp -rf $(PWD)/../backend/build/contracts src/data/contracts
	@$(MAKE) www
	
www:
	@rm -rf dist && npm run dev

deploy:
	@rm -rf dist
	@npm run build
	@npm run deploy:netlify
	@rm -rf dist

.PHONY: \
	run \
	www \
	deploy 