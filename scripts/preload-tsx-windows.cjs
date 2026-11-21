const os = require("node:os");
const originalUserInfo = os.userInfo.bind(os);

os.userInfo = function userInfo(options) {
  try {
    return originalUserInfo(options);
  } catch (error) {
    if (process.platform !== "win32" || error?.code !== "ERR_SYSTEM_ERROR") throw error;
    return {
      username: process.env.USERNAME || "windows-user",
      uid: -1,
      gid: -1,
      shell: process.env.ComSpec || "",
      homedir: process.env.USERPROFILE || process.cwd(),
    };
  }
};
