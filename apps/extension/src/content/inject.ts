export const inject = (scriptPath: string) => {
  const scriptEl = document.createElement('script');
  scriptEl.src = chrome.runtime.getURL(scriptPath);
  scriptEl.charset = 'utf-8';
  scriptEl.onload = () => {
    scriptEl.parentNode?.removeChild(scriptEl);
  };

  (document.head || document.documentElement).appendChild(scriptEl);
};
