declare module 'slugify' {
  interface SlugifyOptions {
    replacement?: string;
    remove?: RegExp;
    lower?: boolean;
    strict?: boolean;
    locale?: string;
    trim?: boolean;
  }

  function slugify(string: string, options?: SlugifyOptions | string): string;
  
  namespace slugify {
    function extend(chars: { [key: string]: string }): void;
  }

  export = slugify;
}
