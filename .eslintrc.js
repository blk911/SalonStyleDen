module.exports = {
  "extends": [
    "eslint:recommended"
  ],
  "env": {
    "browser": true,
    "node": true,
    "es2022": true
  },
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module"
  },
  "root": true,
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "CallExpression[callee.object.name='JSON'][callee.property.name='parse']",
        "message": "Use safeParse() instead of JSON.parse() to prevent '[object Object]' crashes"
      },
      {
        "selector": "CallExpression[callee.object.name='JSON'][callee.property.name='stringify']",
        "message": "Use safeStringify() instead of JSON.stringify() for better error handling"
      }
    ]
  }
};