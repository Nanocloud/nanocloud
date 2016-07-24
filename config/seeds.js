module.exports.seeds = {
  client: {
    data: [
      {
        name: "frontend",
        clientId: "9405fb6b0e59d2997e3c777a22d8f0e617a9f5b36b6565c7579e5be6deb8f7ae",
        clientSecret: ""
      }
    ],
    unique: ['name', 'clientId']
  },
  user: {
    data: [
      {
        id: "aff17b8b-bf91-40bf-ace6-6dfc985680bb",
        firstName: "Admin",
        lastName: "Nanocloud",
        password: "admin",
        email: "admin@nanocloud.com",
        activated: true,
        isAdmin: true
      }
    ],
    unique: ["email"]
  },
  apps: {
    data: [
      {
        alias: 'Desktop',
        displayName: 'Desktop',
        filePath: 'C:\Windows\explorer.exe'
      }
    ],
    unique: ['alias']
  }
};
