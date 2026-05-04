// src/pages/Mateus/Home/components/mobile/game/driving/domain/homeDrive.globalDebugFlags.ts

/**
 * Diagnóstico visual do HomeDrive.
 *
 * true  = monta sampler + painel com FPS, frame budget, vilões e WebGL stats.
 * false = não monta sampler nem overlay.
 */
export const HOME_DRIVE_RUNTIME_DIAGNOSTICS_OVERLAY_ENABLED = false;

/**
 * Frequência de publicação do snapshot do diagnóstico.
 * Mantém o painel útil sem causar re-render React a cada frame.
 */
export const HOME_DRIVE_RUNTIME_DIAGNOSTICS_SAMPLE_HZ = 4;

/**
 * Alvo real do diagnóstico.
 * 60 FPS = 16.67 ms por frame. Acima disso o overlay mostra déficit.
 */
export const HOME_DRIVE_RUNTIME_DIAGNOSTICS_TARGET_FPS = 60;

/**
 * Limite visual usado apenas para avisar no painel quando o JS heap estiver alto.
 */
export const HOME_DRIVE_RUNTIME_DIAGNOSTICS_MEMORY_WARNING_MB = 256;

/**
 * Toggles reais do mundo do jogo.
 *
 * Isto NÃO liga/desliga diagnóstico. Isto remove o subsistema da simulação
 * e da renderização para você testar FPS de forma isolada.
 *
 * Como usar:
 * - pedestres off: HOME_DRIVE_WORLD_PEDESTRIANS_ON = false
 * - carros off:    HOME_DRIVE_WORLD_CARS_ON = false
 * - prédios off:   HOME_DRIVE_WORLD_BUILDINGS_ON = false
 *
 * Deixe todos como true para o jogo completo.
 */
export const HOME_DRIVE_WORLD_CARS_ON = true;
export const HOME_DRIVE_WORLD_PEDESTRIANS_ON = true;
export const HOME_DRIVE_WORLD_BUILDINGS_ON = true;

/**
 * Quantidade-alvo de carros andando.
 *
 * Mantém o tráfego vivo, mas reduz o custo fixo de IA/colisão/render
 * em comparação ao patamar anterior de 100 carros em movimento.
 * Carros estacionados continuam controlados separadamente.
 */
export const HOME_DRIVE_WORLD_MOVING_CARS_TARGET_COUNT = 70;

export const HOME_DRIVE_WORLD_TOGGLES = Object.freeze({
  cars: HOME_DRIVE_WORLD_CARS_ON,
  pedestrians: HOME_DRIVE_WORLD_PEDESTRIANS_ON,
  buildings: HOME_DRIVE_WORLD_BUILDINGS_ON,
});

/**
 * Liga o modo de tráfego por pool residente.
 *
 * O número total de carros e os modelos continuam os mesmos. O que muda é o
 * custo por frame: carros frios/longe param de rodar IA completa e alguns são
 * reposicionados para ruas ao redor do player quando já estão fora do campo útil.
 */
export const HOME_DRIVE_TRAFFIC_RUNTIME_RECYCLING_ENABLED = true;

/**
 * Liga o scheduler de tráfego com orçamento fixo.
 *
 * Este é o controle real do peso dos carros: só uma janela pequena ao redor do
 * player roda awareness/faixa/frenagem completa. O restante fica em cinemática
 * barata ou congelado até ser reciclado.
 */
export const HOME_DRIVE_TRAFFIC_FRAME_BUDGET_ENABLED = true;

/**
 * Liga culling visual dos carros fora do volume útil da câmera.
 *
 * Não remove carros do estado. Só esconde instâncias muito distantes para reduzir
 * matrizes atualizadas e peças renderizadas por frame.
 */
export const HOME_DRIVE_TRAFFIC_RENDER_CULLING_ENABLED = true;

/**
 * Liga renderização empacotada por instância visível.
 *
 * Em vez de atualizar a matriz de todos os carros e mandar carros ocultos para
 * baixo do mapa, cada InstancedMesh passa a usar mesh.count = carros visíveis
 * e preenche somente as instâncias que aparecem naquele tier visual.
 */
export const HOME_DRIVE_TRAFFIC_PACK_VISIBLE_INSTANCES_ENABLED = true;

/**
 * Liga tiers visuais por distância.
 *
 * O modelo perto do player continua completo. Em distâncias onde detalhes não
 * são perceptíveis no mobile, acessórios pequenos deixam de ser atualizados e
 * renderizados. Isso reduz CPU e draw de instâncias sem mexer nos modelos base.
 */
export const HOME_DRIVE_TRAFFIC_DISTANCE_DETAIL_BUDGET_ENABLED = true;

/**
 * Frequência do cálculo de máscara visual de carros.
 * Baixo o suficiente para não pesar, alto o suficiente para não gerar pop-in brusco.
 */
export const HOME_DRIVE_TRAFFIC_RENDER_MASK_HZ = 6;

/**
 * Liga o anti-acúmulo do tráfego.
 *
 * Mantém o mesmo pool e os mesmos modelos, mas corrige o efeito colateral do
 * orçamento agressivo: carros reciclados não podem cair no mesmo ponto/faixa e
 * carros frios travados recebem separação/recuperação antes de virarem fila
 * infinita.
 */
export const HOME_DRIVE_TRAFFIC_CONGESTION_GUARD_ENABLED = true;
