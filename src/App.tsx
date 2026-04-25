import { TournamentProvider, useTournament } from './context/TournamentContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download, Upload, Trophy, Users, Swords, Lock, Key, Save } from "lucide-react";
import TeamsManager from './components/TeamsManager';
import PreSeason from './components/PreSeason';
import NovaCup from './components/NovaCup';
import SuperNovaCup from './components/SuperNovaCup';
import * as React from 'react';
import { useRef, useState } from 'react';
import { Input } from "@/components/ui/input";
import { isValidTournamentData } from './types';

function Dashboard() {
  const { isEditMode, setIsEditMode, data, setData, saveToServer } = useTournament();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleEditModeToggle = (checked: boolean) => {
    if (checked) {
      setShowPasswordModal(true);
      setPassword("");
      setPasswordError("");
    } else {
      setIsEditMode(false);
    }
  };

  const handlePasswordSubmit = () => {
    if (password === "8888") {
      setIsEditMode(true);
      setShowPasswordModal(false);
    } else {
      setPasswordError("密码错误");
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "dota2-tournament-data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          if (isValidTournamentData(importedData)) {
            setData(importedData);
            alert('数据导入成功！');
          } else {
            alert('文件格式错误！请导入由本系统导出的有效比赛数据格式。');
          }
        } catch (error) {
          alert('解析 JSON 文件失败');
        } finally {
          // Reset file input so the same file could be selected again
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/40 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/20 p-1.5 rounded-md border border-primary/30">
              <Trophy className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-lg font-bold tracking-wider text-white drop-shadow-md">新星杯</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2 bg-card/80 px-3 py-1 rounded-full border border-border/60 shadow-inner">
              <Switch 
                id="edit-mode" 
                checked={isEditMode}
                onCheckedChange={handleEditModeToggle}
                className="data-[state=checked]:bg-primary scale-90"
              />
              <Label htmlFor="edit-mode" className={`text-xs font-bold cursor-pointer transition-colors ${isEditMode ? 'text-primary' : 'text-muted-foreground'}`}>
                {isEditMode ? '编辑' : '预览'}
              </Label>
            </div>
            
            {isEditMode && (
              <div className="flex items-center gap-1.5">
                <input 
                  type="file" 
                  accept=".json" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleImport}
                />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-8 bg-background/50 border-border/60 hover:bg-background hover:text-white text-xs">
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  导入
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport} className="h-8 bg-background/50 border-border/60 hover:bg-background hover:text-white text-xs">
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  导出
                </Button>
                <Button size="sm" onClick={saveToServer} className="h-8 bg-primary hover:bg-primary/90 text-white font-bold text-xs ml-2 shadow-md">
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  发布/保存数据
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-card border border-border/60 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary/20 p-2 rounded-full border border-primary/30">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-white">进入编辑模式</h3>
            </div>
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-2 bg-background/50 rounded-md border border-border/50 px-3 overflow-hidden focus-within:border-primary transition-colors">
                <Key className="w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="请输入密码"
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-1 placeholder:text-muted-foreground/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                  autoFocus
                />
              </div>
              {passwordError && (
                <p className="text-destructive text-sm font-medium animate-in slide-in-from-top-1">{passwordError}</p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowPasswordModal(false)} className="bg-transparent border-border/60 hover:bg-muted text-muted-foreground transition-all">
                取消
              </Button>
              <Button onClick={handlePasswordSubmit} className="bg-primary hover:bg-primary/90 text-white shadow-md transition-all">
                确认
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 container mx-auto px-4 py-8">
        <Tabs defaultValue="preseason" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-card/80 backdrop-blur-sm border border-border/60 p-1.5 mb-8 shadow-lg rounded-xl h-auto">
            <TabsTrigger value="teams" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all rounded-lg font-bold">
              <Users className="w-4 h-4 mr-2" />
              队伍管理
            </TabsTrigger>
            <TabsTrigger value="preseason" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all rounded-lg font-bold">
              <Swords className="w-4 h-4 mr-2" />
              季前热身积分赛
            </TabsTrigger>
            <TabsTrigger value="novacup" className="py-3 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all rounded-lg font-bold">
              <Trophy className="w-4 h-4 mr-2" />
              新星杯
            </TabsTrigger>
            <TabsTrigger value="supernova" className="py-3 data-[state=active]:bg-[#cda34f] data-[state=active]:text-black data-[state=active]:shadow-md transition-all rounded-lg font-bold">
              <Trophy className="w-4 h-4 mr-2 text-[#cda34f] data-[state=active]:text-black" />
              超新星杯
            </TabsTrigger>
          </TabsList>
          
          <div className="min-h-[600px]">
            <TabsContent value="teams" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
              <TeamsManager />
            </TabsContent>
            <TabsContent value="preseason" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
              <PreSeason />
            </TabsContent>
            <TabsContent value="novacup" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
              <NovaCup />
            </TabsContent>
            <TabsContent value="supernova" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SuperNovaCup />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <TournamentProvider>
      <Dashboard />
    </TournamentProvider>
  );
}
