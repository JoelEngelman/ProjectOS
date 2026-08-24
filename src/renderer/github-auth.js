(() => {
  const CLIENT_ID = 'Ov23li8f2aoBQWKLBwzx';
  const notice = (message) => {
    const old = document.getElementById('github-device-notice');
    if (old) old.remove();
    const el = document.createElement('div');
    el.id = 'github-device-notice';
    el.style.cssText = 'position:fixed;z-index:9999;left:50%;top:24px;transform:translateX(-50%);max-width:560px;padding:16px 20px;border:1px solid rgba(255,255,255,.85);border-radius:16px;background:rgba(255,255,255,.88);box-shadow:0 18px 50px rgba(0,0,0,.16);backdrop-filter:blur(24px);font:14px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#1d1d1f;line-height:1.45';
    el.innerHTML = message;
    document.body.appendChild(el);
  };
  const connectGitHub = async () => {
    try {
      if (localStorage.getItem('projectos-github-token')) {
        notice('GitHub is already connected to ProjectOS.');
        return;
      }
      const response = await fetch('https://github.com/login/device/code', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: CLIENT_ID, scope: 'repo workflow' })
      });
      const data = await response.json();
      if (!data.device_code) {
        throw new Error(data.error_description || 'GitHub Device Flow is not enabled for this OAuth App.');
      }
      notice(`GitHub authorization started.<br><br><b>1.</b> Open <a href="${data.verification_uri}" target="_blank" rel="noopener">${data.verification_uri}</a><br><b>2.</b> Enter code <strong>${data.user_code}</strong><br><br>After you approve ProjectOS, this page will connect automatically.`);
      const poll = async () => {
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ client_id: CLIENT_ID, device_code: data.device_code, grant_type: 'urn:ietf:params:oauth:grant-type:device_code' })
        });
        const token = await tokenResponse.json();
        if (token.access_token) {
          localStorage.setItem('projectos-github-token', token.access_token);
          notice('✅ GitHub connected to ProjectOS. You can now use the GitHub workspace.');
          return;
        }
        if (token.error === 'authorization_pending' || token.error === 'slow_down') {
          setTimeout(poll, (token.interval || 5) * 1000);
          return;
        }
        throw new Error(token.error_description || token.error || 'GitHub authorization failed.');
      };
      setTimeout(poll, (data.interval || 5) * 1000);
    } catch (error) {
      notice(`GitHub authorization error: ${error.message}`);
    }
  };
  window.projectOS = window.projectOS || {};
  window.projectOS.connectGitHub = connectGitHub;
})();
