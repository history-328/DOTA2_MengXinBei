import { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Users, Edit2, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default function TeamsManager() {
  const { data, setData, isEditMode } = useTournament();
  const [newTeamName, setNewTeamName] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newPlayers, setNewPlayers] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);

  const handleSaveTeam = () => {
    if (!newTeamName.trim() || !newClassName.trim()) return;
    
    const playersList = newPlayers
      .split(/[,，\n]+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    if (editingTeamId) {
      setData(prev => ({
        ...prev,
        teams: prev.teams.map(t => t.id === editingTeamId ? {
          ...t,
          name: newTeamName.trim(),
          className: newClassName.trim(),
          players: playersList
        } : t)
      }));
      setEditingTeamId(null);
    } else {
      setData(prev => ({
        ...prev,
        teams: [
          ...prev.teams,
          {
            id: Math.random().toString(36).substr(2, 9),
            name: newTeamName.trim(),
            className: newClassName.trim(),
            isSupernova: false,
            players: playersList
          }
        ]
      }));
    }
    
    setNewTeamName('');
    setNewClassName('');
    setNewPlayers('');
  };

  const handleEditTeam = (team: any) => {
    setNewTeamName(team.name);
    setNewClassName(team.className);
    setNewPlayers(team.players ? team.players.join(', ') : '');
    setEditingTeamId(team.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = (id: string) => {
    setTeamToDelete(id);
  };

  const handleDeleteTeam = () => {
    if (!teamToDelete) return;
    setData(prev => ({
      ...prev,
      teams: prev.teams.filter(t => t.id !== teamToDelete)
    }));
    setTeamToDelete(null);
  };

  const toggleSupernova = (id: string) => {
    setData(prev => ({
      ...prev,
      teams: prev.teams.map(t => 
        t.id === id ? { ...t, isSupernova: !t.isSupernova } : t
      )
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">参赛队伍 ({data.teams.length})</h2>
      </div>

      {isEditMode && (
        <div className="bg-card/80 backdrop-blur-sm p-5 rounded-lg border border-border/60 shadow-lg flex flex-col gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="className" className="text-muted-foreground font-bold">班级名称</Label>
              <Input 
                id="className" 
                placeholder="例如：萌新1班" 
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className="bg-background/50 border-border/50 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamName" className="text-muted-foreground font-bold">队伍名称</Label>
              <Input 
                id="teamName" 
                placeholder="例如：无敌战队" 
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="bg-background/50 border-border/50 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="players" className="text-muted-foreground font-bold">队员名单 (用逗号或换行分隔)</Label>
              <Input 
                id="players" 
                placeholder="例如：Maybe, Ame, Chalice, fy, xNova" 
                value={newPlayers}
                onChange={(e) => setNewPlayers(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTeam()}
                className="bg-background/50 border-border/50 focus:border-primary"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSaveTeam} className="flex-1 bg-primary hover:bg-primary/90 text-white shadow-md">
                {editingTeamId ? <Edit2 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                {editingTeamId ? '保存修改' : '添加队伍'}
              </Button>
              {editingTeamId && (
                <Button variant="outline" onClick={() => {
                  setEditingTeamId(null);
                  setNewTeamName('');
                  setNewClassName('');
                  setNewPlayers('');
                }} className="bg-background/50 border-border/60 hover:bg-background hover:text-white">
                  取消编辑
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="border border-border/60 rounded-md bg-card/50 backdrop-blur-sm shadow-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="font-bold text-muted-foreground">班级</TableHead>
              <TableHead className="font-bold text-muted-foreground">队伍名称</TableHead>
              <TableHead className="font-bold text-muted-foreground">队员</TableHead>
              <TableHead className="font-bold text-muted-foreground">组别</TableHead>
              {isEditMode && <TableHead className="text-right font-bold text-muted-foreground">操作</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.teams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isEditMode ? 5 : 4} className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  暂无队伍数据
                </TableCell>
              </TableRow>
            ) : (
              data.teams.map((team) => (
                <TableRow key={team.id} className="border-border/50 hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium text-foreground/90">{team.className}</TableCell>
                  <TableCell className="font-bold text-white">{team.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {team.players && team.players.length > 0 ? (
                        team.players.map((player, idx) => (
                          <Badge key={idx} variant="outline" className="bg-background/50 border-border/50 text-xs font-normal">
                            {player}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">未登记</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {isEditMode ? (
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={team.isSupernova} 
                          onCheckedChange={() => toggleSupernova(team.id)} 
                          className="data-[state=checked]:bg-[#cda34f]"
                        />
                        <span className={`text-sm font-bold ${team.isSupernova ? 'text-[#cda34f]' : 'text-muted-foreground'}`}>
                          {team.isSupernova ? '超新星' : '新星'}
                        </span>
                      </div>
                    ) : (
                      <Badge variant={team.isSupernova ? "default" : "secondary"} className={team.isSupernova ? "bg-[#cda34f] hover:bg-[#cda34f]/90 text-black font-bold" : "bg-muted text-muted-foreground"}>
                        {team.isSupernova ? '超新星' : '新星'}
                      </Badge>
                    )}
                  </TableCell>
                  {isEditMode && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditTeam(team)} className="text-primary hover:text-primary hover:bg-primary/10">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete(team.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Modal */}
      {teamToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border/60 rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-destructive/20 p-2 rounded-full">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="text-lg font-bold text-white">确认删除队伍？</h3>
            </div>
            <p className="text-muted-foreground mb-6 text-sm">
              此操作不可撤销。删除队伍可能会影响已生成的赛程和积分榜。
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setTeamToDelete(null)} className="bg-transparent border-border/60 hover:bg-muted">
                取消
              </Button>
              <Button variant="destructive" onClick={handleDeleteTeam}>
                确认删除
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
