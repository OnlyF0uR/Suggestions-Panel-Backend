module.exports = {
    apps: [
        {
            name: "Panel - Backend",
            script: "./mod.ts",
            interpreter: "deno",
            interpreterArgs: "run --allow-net",
        },
    ],
};