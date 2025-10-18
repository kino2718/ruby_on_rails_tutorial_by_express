npm install
npm run build:css
DISABLE_DATABASE_ENVIRONMENT_CHECK=1 npm run migrate:reset:prod
npx knex seed:run
