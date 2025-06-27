# React + Vite

This template provides a minimal setup to get React working in Vite with HMR (Hot Module Replacement) and some ESLint rules.

## Official Plugins

Vite currently supports two official plugins for React:

- [**@vitejs/plugin-react**](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react): Uses [Babel](https://babeljs.io/) for Fast Refresh.
- [**@vitejs/plugin-react-swc**](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc): Uses [SWC](https://swc.rs/) for Fast Refresh.

## Expanding the ESLint Configuration

If you're building a production-grade application, it's recommended to use TypeScript along with type-aware lint rules. This helps catch more issues during development and improves code quality.

### TypeScript Integration

Check out the official [React + TypeScript Vite template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to get started with TypeScript.

For type-aware linting, integrate [`typescript-eslint`](https://typescript-eslint.io/) in your project. This allows ESLint to understand TypeScript syntax and types, enabling powerful lint rules..
