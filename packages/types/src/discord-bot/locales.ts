export type Prefixed<P extends string, T extends string> = `${P}.${T}`;

//#############################################################################
// Message
//#############################################################################

export interface MessageLocale {
  firstTime: string;
  success: string;
  nodeError: string;
  unknownError: string;
  discordJsError: string;
  apiError?: string;
}

export type MessageLocaleKey = keyof MessageLocale;

//#############################################################################
// Base
//#############################################################################

export interface BaseLocale {
  name: string;
  messages: MessageLocale;
}

export type BaseLocaleKey = keyof BaseLocale;

export type BaseLocaleDotKey = Exclude<BaseLocaleKey, 'messages'> | Prefixed<'messages', MessageLocaleKey>;

//#############################################################################
// Task
//#############################################################################

export interface TaskLocale extends BaseLocale {
  memo?: string;
}

export type TaskLocaleKey = keyof TaskLocale;

export type TaskLocaleDotKey = Exclude<TaskLocaleKey, 'messages'> | Prefixed<'messages', MessageLocaleKey>;

//#############################################################################
// Command
//#############################################################################

export interface CommandLocale extends BaseLocale {
  description: string;
  tasks?: Record<string, TaskLocale>;
}

export type CommandLocaleKey = keyof CommandLocale;

export type CommandLocaleDotKey = LocaleKeyPathsWithTasks<CommandLocale>;

//#############################################################################
// Event
//#############################################################################

export interface EventLocale extends BaseLocale {
  description: string;
}

export type EventLocaleKey = keyof EventLocale;

export type EventLocaleDotKey = LocaleKeyPathsWithoutTasks<EventLocale>;

//#############################################################################
// Locale
//#############################################################################

export type LocaleKeyPaths<T, ExtraTop extends string = never, IncludeTasks extends boolean = false> =
  | Exclude<keyof T, 'messages' | 'tasks'>
  | Prefixed<'messages', MessageLocaleKey>
  | (IncludeTasks extends true ? `tasks.${string}.${TaskLocaleDotKey}` : never)
  | ExtraTop;
export type LocaleKeyPathsWithTasks<T, ExtraTop extends string = never> = LocaleKeyPaths<T, ExtraTop, true>;
export type LocaleKeyPathsWithoutTasks<T, ExtraTop extends string = never> = LocaleKeyPaths<T, ExtraTop, false>;

export type LocaleKey = 'en-US' | 'ja';

export type Locale = BaseLocale | CommandLocale;

export type Locales<T = Locale> = {
  [K in LocaleKey]: T;
};
