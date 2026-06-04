import { Annotation, MessagesAnnotation } from '@langchain/langgraph';

export const PipelineState = Annotation.Root({
  ...MessagesAnnotation.spec,
  isAuthorized: Annotation<boolean | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  finalResult: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => '',
  }),
});

export type PipelineStateType = typeof PipelineState.State;
