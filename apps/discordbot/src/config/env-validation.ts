import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import Joi from 'joi';

/**
 * Interface representing the environment variables.
 */
export interface EnvironmentVariables {
  /**
   * The base URL of the application.
   */
  BASE_URL?: string;

  /**
   * The format of the logs.
   */
  LOG_FORMAT?: string;

  /**
   * The token for Discord authentication.
   */
  DISCORD_BOT_TOKEN: string;

  TEST_GUILD?: string;
}

/**
 * DTO class for validating environment variables.
 */
export class EnvironmentVariablesDto {
  @IsString()
  @IsOptional()
  /**
   * The base URL of the application.
   */
  BASE_URL?: string;

  @IsString()
  @IsOptional()
  /**
   * The format of the logs.
   */
  LOG_FORMAT?: string;

  @IsString()
  @IsNotEmpty()
  DISCORD_BOT_TOKEN!: string;

  @IsOptional()
  @IsString()
  TEST_GUILD?: string;
}

/**
 * Joi validation schema for environment variables.
 */
export const validationSchemaForEnv = Joi.object<EnvironmentVariables, true>({
  /**
   * System
   */
  BASE_URL: Joi.string().default('http://localhost:8080'),
  LOG_FORMAT: Joi.string().default('text'),

  /**
   * Application
   */
  DISCORD_BOT_TOKEN: Joi.string().required(),

  TEST_GUILD: Joi.string(),
});
