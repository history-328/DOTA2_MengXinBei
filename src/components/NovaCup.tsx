import { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Match, Round, BracketNode } from '../types';
import { Plus, Trophy, Swords, GitMerge, Trash2, AlertTriangle } from 'lucide-react';
import BracketViewer from './BracketViewer';

export default function NovaCup() {
  const { data, setData, isEditMode } = useTournament();
  const [activeRound, setActiveRound] = useState<number>(0);
  const [roundToDelete, setRoundToDelete] = useState<string | null>(null);

  const rounds = data.novaCup.swissRounds;
  const bracket = data.novaCup.bracket;
  const teams = data.teams.filter(t => !t.isSupernova);

  const handleAddSwissRound = () => {
    // Calculate current standings to pair
    const currentStandings = teams.map(team => {
      let wins = 0;
      rounds.forEach(round => {
        round.matches.forEach(match => {
          if (match.status === 'completed') {
            if (match.team1Id === team.id && match.score1 > match.score2) wins++;
            else if (match.team2Id === team.id && match.score2 > match.score1) wins++;
          }
        });
      });
      return { ...team, wins };
    }).sort((a, b) => b.wins - a.wins);

    const newRound: Round = {
      id: Math.random().toString(36).substr(2, 9),
      name: `瑞士轮 第 ${rounds.length + 1} 轮`,
      matches: []
    };
    
    for (let i = 0; i < currentStandings.length; i += 2) {
      const t1 = currentStandings[i];
      const t2 = currentStandings[i + 1];
      
      newRound.matches.push({
        id: Math.random().toString(36).substr(2, 9),
        team1Id: t1.id,
        team2Id: t2 ? t2.id : 'bye',
        score1: 0,
        score2: 0,
        status: 'pending'
      });
    }

    setData(prev => ({
      ...prev,
      novaCup: {
        ...prev.novaCup,
        swissRounds: [...prev.novaCup.swissRounds, newRound]
      }
    }));
    setActiveRound(rounds.length);
  };

  const handleAddSingleMatch = (roundId: string) => {
    setData(prev => ({
      ...prev,
      novaCup: {
        ...prev.novaCup,
        swissRounds: prev.novaCup.swissRounds.map(r => 
          r.id === roundId 
            ? {
                ...r,
                matches: [...r.matches, {
                  id: Math.random().toString(36).substr(2, 9),
                  team1Id: null,
                  team2Id: null,
                  score1: 0,
                  score2: 0,
                  status: 'pending'
                }]
              }
            : r
        )
      }
    }));
  };

  const handleDeleteMatch = (roundId: string, matchId: string) => {
    setData(prev => ({
      ...prev,
      novaCup: {
        ...prev.novaCup,
        swissRounds: prev.novaCup.swissRounds.map(r => 
          r.id === roundId 
            ? {
                ...r,
                matches: r.matches.filter(m => m.id !== matchId)
              }
            : r
        )
      }
    }));
  };

  const confirmDeleteRound = (roundId: string) => {
    setRoundToDelete(roundId);
  };

  const handleDeleteRound = () => {
    if (!roundToDelete) return;
    setData(prev => {
      const newRounds = prev.novaCup.swissRounds.filter(r => r.id !== roundToDelete);
      return {
        ...prev,
        novaCup: {
          ...prev.novaCup,
          swissRounds: newRounds
        }
      };
    });
    setRoundToDelete(null);
    setActiveRound(prev => Math.max(0, prev - 1));
  };

  const updateSwissMatchScore = (roundId: string, matchId: string, score1: number, score2: number) => {
    setData(prev => ({
      ...prev,
      novaCup: {
        ...prev.novaCup,
        swissRounds: prev.novaCup.swissRounds.map(r => 
          r.id === roundId 
            ? {
                ...r,
                matches: r.matches.map(m => 
                  m.id === matchId 
                    ? { 
                        ...m, 
                        score1, 
                        score2, 
                        status: 'completed',
                        winnerId: score1 > score2 ? m.team1Id : (score2 > score1 ? m.team2Id : null),
                        loserId: score1 < score2 ? m.team1Id : (score2 < score1 ? m.team2Id : null)
                      } 
                    : m
                )
              }
            : r
        )
      }
    }));
  };

  const updateSwissMatchTeam = (roundId: string, matchId: string, teamIndex: 1 | 2, teamId: string | null) => {
    setData(prev => ({
      ...prev,
      novaCup: {
        ...prev.novaCup,
        swissRounds: prev.novaCup.swissRounds.map(r => 
          r.id === roundId 
            ? {
                ...r,
                matches: r.matches.map(m => 
                  m.id === matchId 
                    ? { 
                        ...m, 
                        ...(teamIndex === 1 ? { team1Id: teamId } : { team2Id: teamId })
                      } 
                    : m
                )
              }
            : r
        )
      }
    }));
  };

  const generateBracket = () => {
    // Generate a 16-team single elimination bracket
    // For simplicity, we just create an empty 16-team bracket structure
    // In a real app, we'd seed it based on swiss standings
    
    const newBracket: BracketNode[] = [];
    let matchIdCounter = 1;
    
    // Round 0 (16 teams -> 8 matches)
    const round0Matches: BracketNode[] = [];
    for (let i = 0; i < 8; i++) {
      const node: BracketNode = {
        id: `m${matchIdCounter++}`,
        roundIndex: 0,
        position: i,
        match: {
          id: `match_${matchIdCounter}`,
          team1Id: standings[i]?.id || null, // Top 8 vs Bottom 8 roughly
          team2Id: standings[15 - i]?.id || null,
          score1: 0,
          score2: 0,
          status: 'pending'
        }
      };
      round0Matches.push(node);
      newBracket.push(node);
    }
    
    // Round 1 (8 teams -> 4 matches)
    const round1Matches: BracketNode[] = [];
    for (let i = 0; i < 4; i++) {
      const node: BracketNode = {
        id: `m${matchIdCounter++}`,
        roundIndex: 1,
        position: i,
        match: {
          id: `match_${matchIdCounter}`,
          team1Id: null,
          team2Id: null,
          score1: 0,
          score2: 0,
          status: 'pending'
        }
      };
      round1Matches.push(node);
      newBracket.push(node);
      
      // Link previous round
      round0Matches[i * 2].nextMatchId = node.id;
      round0Matches[i * 2 + 1].nextMatchId = node.id;
    }
    
    // Round 2 (4 teams -> 2 matches)
    const round2Matches: BracketNode[] = [];
    for (let i = 0; i < 2; i++) {
      const node: BracketNode = {
        id: `m${matchIdCounter++}`,
        roundIndex: 2,
        position: i,
        match: {
          id: `match_${matchIdCounter}`,
          team1Id: null,
          team2Id: null,
          score1: 0,
          score2: 0,
          status: 'pending'
        }
      };
      round2Matches.push(node);
      newBracket.push(node);
      
      // Link previous round
      round1Matches[i * 2].nextMatchId = node.id;
      round1Matches[i * 2 + 1].nextMatchId = node.id;
    }
    
    // Round 3 (Finals -> 1 match)
    const finalNode: BracketNode = {
      id: `m${matchIdCounter++}`,
      roundIndex: 3,
      position: 0,
      match: {
        id: `match_${matchIdCounter}`,
        team1Id: null,
        team2Id: null,
        score1: 0,
        score2: 0,
        status: 'pending'
      }
    };
    newBracket.push(finalNode);
    round2Matches[0].nextMatchId = finalNode.id;
    round2Matches[1].nextMatchId = finalNode.id;

    setData(prev => ({
      ...prev,
      novaCup: {
        ...prev.novaCup,
        bracket: newBracket
      }
    }));
  };

  const updateBracketMatchScore = (matchId: string, score1: number, score2: number) => {
    setData(prev => {
      const newBracket = [...prev.novaCup.bracket];
      const nodeIndex = newBracket.findIndex(n => n.match.id === matchId);
      
      if (nodeIndex !== -1) {
        const node = newBracket[nodeIndex];
        const winnerId = score1 > score2 ? node.match.team1Id : (score2 > score1 ? node.match.team2Id : null);
        
        newBracket[nodeIndex] = {
          ...node,
          match: {
            ...node.match,
            score1,
            score2,
            status: 'completed',
            winnerId
          }
        };
        
        // Propagate winner to next match
        if (winnerId && node.nextMatchId) {
          const nextNodeIndex = newBracket.findIndex(n => n.id === node.nextMatchId);
          if (nextNodeIndex !== -1) {
            const nextNode = newBracket[nextNodeIndex];
            // Determine if this winner goes to team1 or team2 slot based on position
            const isTopSlot = node.position % 2 === 0;
            
            newBracket[nextNodeIndex] = {
              ...nextNode,
              match: {
                ...nextNode.match,
                team1Id: isTopSlot ? winnerId : nextNode.match.team1Id,
                team2Id: !isTopSlot ? winnerId : nextNode.match.team2Id
              }
            };
          }
        }
      }
      
      return {
        ...prev,
        novaCup: {
          ...prev.novaCup,
          bracket: newBracket
        }
      };
    });
  };

  const updateBracketTeam = (matchId: string, teamIndex: 1 | 2, teamId: string | null) => {
    setData(prev => {
      const newBracket = [...prev.novaCup.bracket];
      const nodeIndex = newBracket.findIndex(n => n.match.id === matchId);
      
      if (nodeIndex !== -1) {
        const node = newBracket[nodeIndex];
        newBracket[nodeIndex] = {
          ...node,
          match: {
            ...node.match,
            ...(teamIndex === 1 ? { team1Id: teamId } : { team2Id: teamId })
          }
        };
      }
      
      return {
        ...prev,
        novaCup: {
          ...prev.novaCup,
          bracket: newBracket
        }
      };
    });
  };

  // Calculate standings
  const standings = teams.map(team => {
    let wins = 0;
    let losses = 0;
    
    rounds.forEach(round => {
      round.matches.forEach(match => {
        if (match.status === 'completed') {
          if (match.team1Id === team.id) {
            if (match.score1 > match.score2) wins++;
            else if (match.score1 < match.score2) losses++;
          } else if (match.team2Id === team.id) {
            if (match.score2 > match.score1) wins++;
            else if (match.score2 < match.score1) losses++;
          }
        }
      });
    });

    return { ...team, wins, losses };
  }).sort((a, b) => b.wins - a.wins);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">新星杯社区锦标赛</h2>
      </div>

      <Tabs defaultValue="swiss" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-card/50 border border-border/50 p-1 mb-6">
          <TabsTrigger value="swiss" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Swords className="w-4 h-4 mr-2" />
            瑞士轮 (24进16)
          </TabsTrigger>
          <TabsTrigger value="bracket" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <GitMerge className="w-4 h-4 mr-2" />
            淘汰赛 (16进1)
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="swiss" className="mt-0 outline-none space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">瑞士轮阶段</h3>
            {isEditMode && (
              <Button onClick={handleAddSwissRound} className="bg-primary hover:bg-primary/90 text-white shadow-md">
                <Plus className="w-4 h-4 mr-2" />
                生成新一轮
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {rounds.length > 0 ? (
                <>
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {rounds.map((round, idx) => (
                      <Button 
                        key={round.id} 
                        variant={activeRound === idx ? "default" : "outline"}
                        onClick={() => setActiveRound(idx)}
                        className={`whitespace-nowrap ${activeRound === idx ? 'bg-primary text-white' : 'border-border/50 text-muted-foreground hover:text-white hover:border-border'}`}
                      >
                        {round.name}
                      </Button>
                    ))}
                  </div>

                  <div className="bg-card/50 backdrop-blur-sm border border-border/60 rounded-xl p-5 space-y-4 shadow-lg">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg text-white">{rounds[activeRound]?.name} 对阵表</h3>
                        {isEditMode && rounds[activeRound] && (
                          <Button size="sm" variant="ghost" onClick={() => confirmDeleteRound(rounds[activeRound].id)} className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs">
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            删除此轮
                          </Button>
                        )}
                      </div>
                      {isEditMode && (
                        <Button size="sm" variant="outline" onClick={() => handleAddSingleMatch(rounds[activeRound].id)} className="h-8 bg-background/50 border-border/60 hover:bg-background hover:text-white text-xs">
                          <Plus className="w-3.5 h-3.5 mr-1.5" />
                          添加单场比赛
                        </Button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {rounds[activeRound]?.matches.map(match => {
                        const t1 = teams.find(t => t.id === match.team1Id);
                        const t2 = teams.find(t => t.id === match.team2Id);
                        
                        const t1Name = match.team1Id === 'bye' ? '轮空 (Bye)' : (t1?.name || '待定');
                        const t2Name = match.team2Id === 'bye' ? '轮空 (Bye)' : (t2?.name || '待定');
                        
                        return (
                          <div key={match.id} className="flex items-center gap-2">
                            <div className="flex-1 flex items-center justify-between p-3 bg-card/80 backdrop-blur-sm rounded-lg border border-border/60 shadow-sm hover:border-primary/50 transition-colors">
                              <div className={`flex-1 text-right font-semibold text-sm ${match.winnerId === match.team1Id && match.team1Id ? 'text-primary' : 'text-foreground/90'}`}>
                                {isEditMode ? (
                                  <select 
                                    className="bg-background/50 border border-border/50 rounded p-1.5 text-sm font-semibold text-foreground/90 w-full max-w-[200px] focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                    value={match.team1Id || ''}
                                    onChange={(e) => updateSwissMatchTeam(rounds[activeRound].id, match.id, 1, e.target.value || null)}
                                  >
                                    <option value="">选择队伍...</option>
                                    <option value="bye">-- 轮空 (Bye) --</option>
                                    {teams.map(t => (
                                      <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                  </select>
                                ) : (
                                  t1Name
                                )}
                              </div>
                              
                              <div className="px-6 flex items-center gap-3">
                                {isEditMode ? (
                                  <>
                                    <input 
                                      type="number" 
                                      className="w-12 text-center bg-background/50 border border-border/50 rounded p-1 font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                      value={match.score1}
                                      onChange={(e) => updateSwissMatchScore(rounds[activeRound].id, match.id, parseInt(e.target.value) || 0, match.score2)}
                                    />
                                    <span className="text-muted-foreground font-bold">-</span>
                                    <input 
                                      type="number" 
                                      className="w-12 text-center bg-background/50 border border-border/50 rounded p-1 font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                      value={match.score2}
                                      onChange={(e) => updateSwissMatchScore(rounds[activeRound].id, match.id, match.score1, parseInt(e.target.value) || 0)}
                                    />
                                  </>
                                ) : (
                                  <div className="text-xl font-mono font-bold tracking-widest bg-background/50 px-4 py-1 rounded-md border border-border/50 shadow-inner">
                                    {match.status === 'completed' ? (
                                      <>
                                        <span className={match.winnerId === match.team1Id && match.team1Id ? 'text-primary' : ''}>{match.score1}</span>
                                        <span className="text-muted-foreground mx-2">:</span>
                                        <span className={match.winnerId === match.team2Id && match.team2Id ? 'text-primary' : ''}>{match.score2}</span>
                                      </>
                                    ) : 'VS'}
                                  </div>
                                )}
                              </div>
                              
                              <div className={`flex-1 text-left font-semibold text-sm ${match.winnerId === match.team2Id && match.team2Id ? 'text-primary' : 'text-foreground/90'}`}>
                                {isEditMode ? (
                                  <select 
                                    className="bg-background/50 border border-border/50 rounded p-1.5 text-sm font-semibold text-foreground/90 w-full max-w-[200px] focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                    value={match.team2Id || ''}
                                    onChange={(e) => updateSwissMatchTeam(rounds[activeRound].id, match.id, 2, e.target.value || null)}
                                  >
                                    <option value="">选择队伍...</option>
                                    <option value="bye">-- 轮空 (Bye) --</option>
                                    {teams.map(t => (
                                      <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                  </select>
                                ) : (
                                  t2Name
                                )}
                              </div>
                            </div>
                            {isEditMode && (
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteMatch(rounds[activeRound].id, match.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-16 text-muted-foreground border border-dashed border-border/50 rounded-xl bg-card/30">
                  <Swords className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  暂无赛程数据，请在编辑模式下生成新一轮。
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#cda34f]" />
                <h3 className="font-bold text-lg text-white drop-shadow-md">瑞士轮积分榜</h3>
              </div>
              <div className="border border-border/60 rounded-md bg-card/50 backdrop-blur-sm shadow-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent border-border/50">
                      <TableHead className="w-12 text-center font-bold text-muted-foreground">排名</TableHead>
                      <TableHead className="font-bold text-muted-foreground">队伍</TableHead>
                      <TableHead className="text-center font-bold text-muted-foreground">战绩</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standings.map((team, idx) => (
                      <TableRow key={team.id} className={`border-border/50 hover:bg-muted/30 transition-colors ${idx < 16 ? 'bg-primary/5' : ''}`}>
                        <TableCell className="text-center font-bold text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="font-bold text-white">{team.name}</div>
                        </TableCell>
                        <TableCell className="text-center font-mono font-bold">{team.wins}-{team.losses}</TableCell>
                      </TableRow>
                    ))}
                    {standings.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">暂无数据</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="bracket" className="mt-0 outline-none space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">淘汰赛阶段</h3>
            {isEditMode && bracket.length === 0 && (
              <Button onClick={generateBracket} className="bg-primary hover:bg-primary/90 text-white shadow-md">
                <GitMerge className="w-4 h-4 mr-2" />
                生成16强淘汰赛
              </Button>
            )}
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border/60 rounded-xl p-5 shadow-lg overflow-hidden">
            <BracketViewer bracket={bracket} onUpdateMatch={updateBracketMatchScore} onUpdateTeam={updateBracketTeam} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Round Confirmation Modal */}
      {roundToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border/60 rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-destructive/20 p-2 rounded-full">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="text-lg font-bold text-white">确认删除此轮？</h3>
            </div>
            <p className="text-muted-foreground mb-6 text-sm">
              此操作不可撤销。删除此轮将同时删除该轮内的所有比赛记录和积分。
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setRoundToDelete(null)} className="bg-transparent border-border/60 hover:bg-muted">
                取消
              </Button>
              <Button variant="destructive" onClick={handleDeleteRound}>
                确认删除
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
