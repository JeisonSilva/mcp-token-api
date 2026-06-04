import { END, START, StateGraph } from '@langchain/langgraph';
import { PipelineState } from './state';
import { apiKeyGuardNode } from './nodes/apiKeyGuard';

export function createPipeline() {
  const graph = new StateGraph(PipelineState)
    .addNode('apiKeyGuard', apiKeyGuardNode)
    .addEdge(START, 'apiKeyGuard')
    .addEdge('apiKeyGuard', END);

  return graph.compile();
}
