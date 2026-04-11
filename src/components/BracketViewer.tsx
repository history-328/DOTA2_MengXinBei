import { useTournament } from '../context/TournamentContext';
import { BracketNode, Match } from '../types';

interface BracketViewerProps {
  bracket: BracketNode[];
  onUpdateMatch?: (matchId: string, score1: number, score2: number) => void;
  onUpdateTeam?: (matchId: string, teamIndex: 1 | 2, teamId: string | null) => void;
}

export default function BracketViewer({ bracket, onUpdateMatch, onUpdateTeam }: BracketViewerProps) {
  const { data, isEditMode } = useTournament();
  
  if (!bracket || bracket.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border border-dashed border-border/50 rounded-xl">
        暂无淘汰赛数据
      </div>
    );
  }

  // Group nodes by roundIndex
  const rounds: { [key: number]: BracketNode[] } = {};
  let maxRound = 0;
  
  bracket.forEach(node => {
    if (!rounds[node.roundIndex]) {
      rounds[node.roundIndex] = [];
    }
    rounds[node.roundIndex].push(node);
    if (node.roundIndex > maxRound) {
      maxRound = node.roundIndex;
    }
  });

  // Sort nodes within each round by position
  Object.keys(rounds).forEach(key => {
    rounds[parseInt(key)].sort((a, b) => a.position - b.position);
  });

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return 'TBD';
    const team = data.teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown';
  };

  return (
    <div className="flex overflow-x-auto py-8 px-4 gap-12 min-h-[500px]">
      {Array.from({ length: maxRound + 1 }).map((_, roundIdx) => (
        <div key={roundIdx} className="flex flex-col justify-around min-w-[240px] space-y-8">
          {rounds[roundIdx]?.map((node, idx) => (
            <div key={node.id} className="relative">
              <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-lg overflow-hidden shadow-xl hover:border-primary/50 transition-colors">
                <div className="p-1.5 bg-muted/50 border-b border-border/50 text-[10px] uppercase tracking-wider text-center text-muted-foreground font-bold">
                  Match {node.id.substring(node.id.length - 4)}
                </div>
                
                <div className="flex flex-col">
                  {/* Team 1 */}
                  <div className={`flex items-center justify-between p-2.5 border-b border-border/30 ${node.match.winnerId === node.match.team1Id ? 'bg-primary/15' : ''}`}>
                    {isEditMode ? (
                      <select 
                        className="bg-background/50 border border-border/50 rounded p-1 text-sm font-semibold text-foreground/90 w-32 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                        value={node.match.team1Id || ''}
                        onChange={(e) => onUpdateTeam?.(node.match.id, 1, e.target.value || null)}
                      >
                        <option value="">TBD</option>
                        {data.teams.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`font-semibold text-sm truncate pr-2 ${node.match.winnerId === node.match.team1Id ? 'text-primary' : 'text-foreground/90'}`}>
                        {getTeamName(node.match.team1Id)}
                      </span>
                    )}
                    
                    {isEditMode ? (
                      <input 
                        type="number" 
                        className="w-12 text-center bg-background/50 border border-border/50 rounded p-1 text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                        value={node.match.score1}
                        onChange={(e) => onUpdateMatch?.(node.match.id, parseInt(e.target.value) || 0, node.match.score2)}
                      />
                    ) : (
                      <span className={`font-mono font-bold ${node.match.winnerId === node.match.team1Id ? 'text-primary' : 'text-muted-foreground'}`}>
                        {node.match.status === 'completed' ? node.match.score1 : '-'}
                      </span>
                    )}
                  </div>
                  
                  {/* Team 2 */}
                  <div className={`flex items-center justify-between p-2.5 ${node.match.winnerId === node.match.team2Id ? 'bg-primary/15' : ''}`}>
                    {isEditMode ? (
                      <select 
                        className="bg-background/50 border border-border/50 rounded p-1 text-sm font-semibold text-foreground/90 w-32 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                        value={node.match.team2Id || ''}
                        onChange={(e) => onUpdateTeam?.(node.match.id, 2, e.target.value || null)}
                      >
                        <option value="">TBD</option>
                        {data.teams.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`font-semibold text-sm truncate pr-2 ${node.match.winnerId === node.match.team2Id ? 'text-primary' : 'text-foreground/90'}`}>
                        {getTeamName(node.match.team2Id)}
                      </span>
                    )}
                    
                    {isEditMode ? (
                      <input 
                        type="number" 
                        className="w-12 text-center bg-background/50 border border-border/50 rounded p-1 text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                        value={node.match.score2}
                        onChange={(e) => onUpdateMatch?.(node.match.id, node.match.score1, parseInt(e.target.value) || 0)}
                      />
                    ) : (
                      <span className={`font-mono font-bold ${node.match.winnerId === node.match.team2Id ? 'text-primary' : 'text-muted-foreground'}`}>
                        {node.match.status === 'completed' ? node.match.score2 : '-'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Connector lines */}
              {roundIdx < maxRound && (
                <>
                  <div className="absolute top-1/2 -right-6 w-6 h-px bg-border/80"></div>
                  {idx % 2 === 0 ? (
                    <div className="absolute top-1/2 -right-6 w-px h-[calc(50%+2rem)] bg-border/80 rounded-tr-md"></div>
                  ) : (
                    <div className="absolute bottom-1/2 -right-6 w-px h-[calc(50%+2rem)] bg-border/80 rounded-br-md"></div>
                  )}
                </>
              )}
              {roundIdx > 0 && (
                <div className="absolute top-1/2 -left-6 w-6 h-px bg-border/80"></div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
