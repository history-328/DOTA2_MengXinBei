import { useTournament } from '../context/TournamentContext';
import { Button } from "@/components/ui/button";
import { BracketNode } from '../types';
import { GitMerge } from 'lucide-react';
import BracketViewer from './BracketViewer';

export default function SuperNovaCup() {
  const { data, setData, isEditMode } = useTournament();
  const bracket = data.superNovaCup.bracket;
  const teams = data.teams.filter(t => t.isSupernova);

  const generateBracket = () => {
    // Generate a simple 8-team single elimination bracket for demonstration
    // A full double elimination bracket requires a more complex data structure
    
    const newBracket: BracketNode[] = [];
    let matchIdCounter = 1;
    
    // Round 0 (8 teams -> 4 matches)
    const round0Matches: BracketNode[] = [];
    for (let i = 0; i < 4; i++) {
      const node: BracketNode = {
        id: `sn_m${matchIdCounter++}`,
        roundIndex: 0,
        position: i,
        match: {
          id: `sn_match_${matchIdCounter}`,
          team1Id: teams[i * 2]?.id || null,
          team2Id: teams[i * 2 + 1]?.id || null,
          score1: 0,
          score2: 0,
          status: 'pending'
        }
      };
      round0Matches.push(node);
      newBracket.push(node);
    }
    
    // Round 1 (4 teams -> 2 matches)
    const round1Matches: BracketNode[] = [];
    for (let i = 0; i < 2; i++) {
      const node: BracketNode = {
        id: `sn_m${matchIdCounter++}`,
        roundIndex: 1,
        position: i,
        match: {
          id: `sn_match_${matchIdCounter}`,
          team1Id: null,
          team2Id: null,
          score1: 0,
          score2: 0,
          status: 'pending'
        }
      };
      round1Matches.push(node);
      newBracket.push(node);
      
      round0Matches[i * 2].nextMatchId = node.id;
      round0Matches[i * 2 + 1].nextMatchId = node.id;
    }
    
    // Round 2 (Finals -> 1 match)
    const finalNode: BracketNode = {
      id: `sn_m${matchIdCounter++}`,
      roundIndex: 2,
      position: 0,
      match: {
        id: `sn_match_${matchIdCounter}`,
        team1Id: null,
        team2Id: null,
        score1: 0,
        score2: 0,
        status: 'pending'
      }
    };
    newBracket.push(finalNode);
    round1Matches[0].nextMatchId = finalNode.id;
    round1Matches[1].nextMatchId = finalNode.id;

    setData(prev => ({
      ...prev,
      superNovaCup: {
        ...prev.superNovaCup,
        bracket: newBracket
      }
    }));
  };

  const updateBracketMatchScore = (matchId: string, score1: number, score2: number) => {
    setData(prev => {
      const newBracket = [...prev.superNovaCup.bracket];
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
        
        if (winnerId && node.nextMatchId) {
          const nextNodeIndex = newBracket.findIndex(n => n.id === node.nextMatchId);
          if (nextNodeIndex !== -1) {
            const nextNode = newBracket[nextNodeIndex];
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
        superNovaCup: {
          ...prev.superNovaCup,
          bracket: newBracket
        }
      };
    });
  };

  const updateBracketTeam = (matchId: string, teamIndex: 1 | 2, teamId: string | null) => {
    setData(prev => {
      const newBracket = [...prev.superNovaCup.bracket];
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
        superNovaCup: {
          ...prev.superNovaCup,
          bracket: newBracket
        }
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#cda34f] drop-shadow-md">超新星社区锦标赛</h2>
          <p className="text-muted-foreground mt-1 font-medium">优秀学员的高质量对局（当前参赛队伍：{teams.length}支）</p>
        </div>
        {isEditMode && bracket.length === 0 && (
          <Button onClick={generateBracket} className="bg-[#cda34f] hover:bg-[#cda34f]/90 text-black font-bold shadow-md">
            <GitMerge className="w-4 h-4 mr-2" />
            生成淘汰赛
          </Button>
        )}
      </div>

      <div className="bg-card/50 backdrop-blur-sm border border-border/60 rounded-xl p-5 shadow-lg overflow-hidden">
        <BracketViewer bracket={bracket} onUpdateMatch={updateBracketMatchScore} onUpdateTeam={updateBracketTeam} />
      </div>
    </div>
  );
}
