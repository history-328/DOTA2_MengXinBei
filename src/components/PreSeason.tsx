import { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Match, Round } from '../types';
import { Plus, Trophy, Swords, Trash2, AlertTriangle, Users } from 'lucide-react';

export default function PreSeason() {
  const { data, setData, isEditMode } = useTournament();
  const [activeRound, setActiveRound] = useState<number>(0);
  const [roundToDelete, setRoundToDelete] = useState<string | null>(null);
  const [standingsView, setStandingsView] = useState<'class' | 'team'>('class');

  const rounds = data.preSeason.rounds;
  const teams = data.teams.filter(t => !t.isSupernova);

  const handleAddRound = () => {
    const newRound: Round = {
      id: Math.random().toString(36).substr(2, 9),
      name: `第 ${rounds.length + 1} 轮`,
      matches: []
    };
    
    // Simple random pairing for the first round or just empty matches
    // In a real Swiss system, we'd pair based on standings
    const unassignedTeams = [...teams];
    while (unassignedTeams.length >= 2) {
      const t1 = unassignedTeams.splice(Math.floor(Math.random() * unassignedTeams.length), 1)[0];
      const t2 = unassignedTeams.splice(Math.floor(Math.random() * unassignedTeams.length), 1)[0];
      
      newRound.matches.push({
        id: Math.random().toString(36).substr(2, 9),
        team1Id: t1.id,
        team2Id: t2.id,
        score1: 0,
        score2: 0,
        status: 'pending'
      });
    }

    setData(prev => ({
      ...prev,
      preSeason: {
        ...prev.preSeason,
        rounds: [...prev.preSeason.rounds, newRound]
      }
    }));
    setActiveRound(rounds.length);
  };

  const updateMatchScore = (roundId: string, matchId: string, score1: number, score2: number) => {
    setData(prev => ({
      ...prev,
      preSeason: {
        ...prev.preSeason,
        rounds: prev.preSeason.rounds.map(r => 
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

  const updateMatchTeam = (roundId: string, matchId: string, teamIndex: 1 | 2, teamId: string | null) => {
    setData(prev => ({
      ...prev,
      preSeason: {
        ...prev.preSeason,
        rounds: prev.preSeason.rounds.map(r => 
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

  const handleAddSingleMatch = (roundId: string) => {
    setData(prev => ({
      ...prev,
      preSeason: {
        ...prev.preSeason,
        rounds: prev.preSeason.rounds.map(r => 
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
      preSeason: {
        ...prev.preSeason,
        rounds: prev.preSeason.rounds.map(r => 
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
      const newRounds = prev.preSeason.rounds.filter(r => r.id !== roundToDelete);
      return {
        ...prev,
        preSeason: {
          ...prev.preSeason,
          rounds: newRounds
        }
      };
    });
    setRoundToDelete(null);
    setActiveRound(prev => Math.max(0, prev - 1));
  };

  // Calculate standings
  const standings = teams.map(team => {
    let wins = 0;
    let losses = 0;
    let points = 0;
    
    rounds.forEach(round => {
      round.matches.forEach(match => {
        if (match.status === 'completed') {
          if (match.team1Id === team.id) {
            if (match.score1 > match.score2) { wins++; points += 3; }
            else if (match.score1 < match.score2) { losses++; points += 1; }
          } else if (match.team2Id === team.id) {
            if (match.score2 > match.score1) { wins++; points += 3; }
            else if (match.score2 < match.score1) { losses++; points += 1; }
          }
        }
      });
    });

    return { ...team, wins, losses, points };
  }).sort((a, b) => b.points - a.points || b.wins - a.wins);

  const classStandingsMap = new Map();
  standings.forEach(team => {
    if (!team.className) return;
    if (!classStandingsMap.has(team.className)) {
      classStandingsMap.set(team.className, {
        className: team.className,
        teamsCount: 0,
        wins: 0,
        losses: 0,
        points: 0
      });
    }
    const cs = classStandingsMap.get(team.className);
    cs.teamsCount += 1;
    cs.wins += team.wins;
    cs.losses += team.losses;
    cs.points += team.points;
  });

  const classStandings = Array.from(classStandingsMap.values()).sort((a, b) => b.points - a.points || b.wins - a.wins);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">季前热身积分赛</h2>
        {isEditMode && (
          <Button onClick={handleAddRound} className="bg-primary hover:bg-primary/90 text-white shadow-md">
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
                                onChange={(e) => updateMatchTeam(rounds[activeRound].id, match.id, 1, e.target.value || null)}
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
                                  onChange={(e) => updateMatchScore(rounds[activeRound].id, match.id, parseInt(e.target.value) || 0, match.score2)}
                                />
                                <span className="text-muted-foreground font-bold">-</span>
                                <input 
                                  type="number" 
                                  className="w-12 text-center bg-background/50 border border-border/50 rounded p-1 font-mono focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                  value={match.score2}
                                  onChange={(e) => updateMatchScore(rounds[activeRound].id, match.id, match.score1, parseInt(e.target.value) || 0)}
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
                                onChange={(e) => updateMatchTeam(rounds[activeRound].id, match.id, 2, e.target.value || null)}
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#cda34f]" />
              <h3 className="font-bold text-lg text-white drop-shadow-md">积分榜</h3>
            </div>
            <div className="flex bg-background/50 border border-border/50 rounded-lg p-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setStandingsView('class')} 
                className={`h-7 px-3 text-xs font-semibold rounded-md ${standingsView === 'class' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-white'}`}
              >
                班级
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setStandingsView('team')} 
                className={`h-7 px-3 text-xs font-semibold rounded-md ${standingsView === 'team' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-white'}`}
              >
                队伍
              </Button>
            </div>
          </div>
          <div className="border border-border/60 rounded-md bg-card/50 backdrop-blur-sm shadow-xl overflow-hidden">
            {standingsView === 'team' ? (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="w-12 text-center font-bold text-muted-foreground">排名</TableHead>
                    <TableHead className="font-bold text-muted-foreground">队伍</TableHead>
                    <TableHead className="text-center font-bold text-muted-foreground">胜-负</TableHead>
                    <TableHead className="text-right font-bold text-muted-foreground">积分</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standings.map((team, idx) => (
                    <TableRow key={team.id} className="border-border/50 hover:bg-muted/30 transition-colors">
                      <TableCell className="text-center font-bold text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="font-bold text-white">{team.name}</div>
                        <div className="text-xs text-muted-foreground">{team.className}</div>
                      </TableCell>
                      <TableCell className="text-center font-mono">{team.wins}-{team.losses}</TableCell>
                      <TableCell className="text-right font-bold text-primary text-lg">{team.points}</TableCell>
                    </TableRow>
                  ))}
                  {standings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">暂无数据</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="w-12 text-center font-bold text-muted-foreground">排名</TableHead>
                    <TableHead className="font-bold text-muted-foreground">班级</TableHead>
                    <TableHead className="text-center font-bold text-muted-foreground">胜-负</TableHead>
                    <TableHead className="text-right font-bold text-muted-foreground">总分</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classStandings.map((cls, idx) => (
                    <TableRow key={cls.className} className="border-border/50 hover:bg-muted/30 transition-colors">
                      <TableCell className="text-center font-bold text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="font-bold text-white">{cls.className}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Users className="w-3 h-3" /> {cls.teamsCount} 支队伍
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono">{cls.wins}-{cls.losses}</TableCell>
                      <TableCell className="text-right font-bold text-primary text-lg">{cls.points}</TableCell>
                    </TableRow>
                  ))}
                  {classStandings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">暂无数据</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

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
