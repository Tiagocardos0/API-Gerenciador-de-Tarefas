import type { Config } from "jest";

import dotenv from "dotenv"

dotenv.config({ path: ".env" }) 

const config: Config = {
    bail: true,
    preset: "ts-jest",
    testEnvironment: "node",

    moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

export default config;