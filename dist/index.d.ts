import { Plugin, PluginOption } from 'vite';

interface LaravelI18nConfig {
    langDirectory: string;
}
type UserConfig = Partial<LaravelI18nConfig>;

declare const LaravelI18n: (userConfig?: UserConfig) => Plugin | PluginOption[];

export { LaravelI18n };
