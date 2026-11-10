export function configuredModelConfig(env: NodeJS.ProcessEnv = process.env) {
  const provider = env.MODEL_PROVIDER === 'vertex' ? 'vertex' : 'fake';
  return {
    provider,
    modelId: provider === 'vertex' ? (env.VERTEX_MODEL ?? '') : 'fake-fixture',
    promptVersion: '1',
  };
}
