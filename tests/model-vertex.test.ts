import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AI_CANDIDATE_SCHEMA,
  configuredModel,
  FakeModel,
  toVertexResponseSchema,
  vertexGenerateContentRequest,
  VertexVideoModel,
  type ModelInput,
} from '../apps/generator/src/model.ts';

const input: ModelInput = {
  videoUri: 'source/example/task/video.mp4',
  title: 'タオル包装',
  completionCriteria: '袋口が閉じている',
  preferences: { sentenceLength: 20, splitHints: '一つずつ', audioGuidance: false },
  displayMode: 'photo_only',
  confirmedGuidance: ['赤い線を目印にする'],
  durationMs: 120000,
};

test('Vertex request copies only allowed input fields, including nested preferences', async () => {
  const forbidden = {
    displayName: '架空',
    disabilityInfo: {},
    diagnosis: '架空',
    supportInputs: [],
    profile: {},
  };
  const contaminated = {
    ...input,
    ...forbidden,
    preferences: { ...input.preferences, ...forbidden },
  };
  let called = false;
  const model = new VertexVideoModel('example-private-bucket', async (request) => {
    called = true;
    assert.deepEqual(request, {
      videoUri: 'gs://example-private-bucket/source/example/task/video.mp4',
      mimeType: 'video/mp4',
      title: input.title,
      completionCriteria: input.completionCriteria,
      preferences: input.preferences,
      displayMode: input.displayMode,
      confirmedGuidance: input.confirmedGuidance,
      durationMs: input.durationMs,
      responseSchema: AI_CANDIDATE_SCHEMA,
    });
    for (const key of Object.keys(forbidden))
      assert.equal(JSON.stringify(request).includes(key), false);
    return {};
  });
  await model.generate(contaminated);
  assert.equal(called, true);
});

test('Vertex responseSchema preserves supported limits and converts const into enum', () => {
  const schema = toVertexResponseSchema(AI_CANDIDATE_SCHEMA) as any;
  assert.equal(schema.$schema, undefined);
  assert.equal(schema.additionalProperties, undefined);
  assert.deepEqual(schema.properties.schemaVersion, { type: 'string', enum: ['1'] });
  assert.equal(schema.properties.steps.minItems, 1);
  assert.equal(schema.properties.steps.maxItems, 20);
  assert.equal(schema.properties.reviewFlags.maxItems, 10);
  const step = schema.properties.steps.items;
  assert.equal(step.properties.stepId.minLength, undefined);
  assert.equal(step.properties.instructionDraft.maxLength, undefined);
  assert.equal(step.properties.reviewFlags.maxItems, 10);
  for (const key of ['startMs', 'endMs', 'frameMs']) {
    assert.equal(step.properties[key].minimum, 0);
    assert.equal(step.properties[key].maximum, Number.MAX_SAFE_INTEGER);
  }
  assert.deepEqual(step.required, [
    'stepId',
    'startMs',
    'endMs',
    'frameMs',
    'observationCandidate',
    'speechCandidate',
    'instructionDraft',
    'coachingDraft',
    'completionCheckDraft',
    'reviewFlags',
  ]);
  assert.deepEqual(schema.required, ['schemaVersion', 'steps', 'reviewFlags']);
  const serialized = JSON.stringify(schema);
  for (const keyword of ['$schema', 'additionalProperties', 'minLength', 'maxLength', 'const'])
    assert.equal(serialized.includes(`"${keyword}"`), false, keyword);
});

test('Vertex generateContent request uses responseSchema and never responseJsonSchema', () => {
  const request = vertexGenerateContentRequest({
    videoUri: 'gs://example-private-bucket/source/example/task/video.mp4',
    mimeType: 'video/mp4',
    title: input.title,
    completionCriteria: input.completionCriteria,
    preferences: input.preferences,
    displayMode: input.displayMode,
    confirmedGuidance: input.confirmedGuidance,
    durationMs: input.durationMs,
    responseSchema: AI_CANDIDATE_SCHEMA,
  });
  assert.equal('responseJsonSchema' in request.config, false);
  assert.equal(request.config.responseMimeType, 'application/json');
  assert.ok(request.config.responseSchema);
  assert.equal(request.config.abortSignal, undefined);
  assert.equal((request.config.responseSchema as any).properties.steps.maxItems, 20);
  assert.deepEqual(request.contents[0].parts[1], {
    text: JSON.stringify({
      title: input.title,
      completionCriteria: input.completionCriteria,
      preferences: input.preferences,
      displayMode: input.displayMode,
      confirmedGuidance: input.confirmedGuidance,
      durationMs: input.durationMs,
    }),
  });
});

test('model provider requires explicit vertex selection', () => {
  assert.ok(configuredModel({}) instanceof FakeModel);
  assert.ok(configuredModel({ MODEL_PROVIDER: 'other' }) instanceof FakeModel);
  assert.ok(configuredModel({ MODEL_PROVIDER: 'vertex' }) instanceof VertexVideoModel);
});

test('injected transport returns its value unchanged and receives cancellation signal', async () => {
  const controller = new AbortController();
  const result = { candidate: 'transport result' };
  const model = new VertexVideoModel('example-private-bucket', async (_request, signal) => {
    assert.equal(signal, controller.signal);
    return result;
  });
  assert.equal(await model.generate(input, controller.signal), result);
});

test('vertex fails explicitly with missing configuration and never falls back to Fake', async () => {
  const model = configuredModel({
    MODEL_PROVIDER: 'vertex',
    VIDEO_BUCKET: 'example-private-bucket',
  });
  await assert.rejects(model.generate(input), /VERTEX_MODEL_NOT_CONFIGURED/);
});

test('invalid storage locations and already cancelled calls never reach transport', async () => {
  const transport = async () => {
    assert.fail('transport must not run');
  };
  await assert.rejects(new VertexVideoModel('', transport).generate(input), /INVALID_VIDEO_BUCKET/);
  for (const videoUri of ['', '/video.mp4', 'gs://other/video.mp4', '../video.mp4']) {
    await assert.rejects(
      new VertexVideoModel('example-private-bucket', transport).generate({ ...input, videoUri }),
      /INVALID_VIDEO_OBJECT_PATH/,
    );
  }
  await assert.rejects(
    new VertexVideoModel('example-private-bucket', transport).generate(input, AbortSignal.abort()),
    { name: 'AbortError' },
  );
});

test('transport failures propagate without fallback', async () => {
  const error = Error('TRANSPORT_FAILED');
  const model = new VertexVideoModel('example-private-bucket', async () => {
    throw error;
  });
  await assert.rejects(model.generate(input), (e) => e === error);
});
