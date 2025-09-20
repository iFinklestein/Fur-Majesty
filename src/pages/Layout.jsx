

import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Pet } from "@/api/entities";
import { User } from "@/api/entities";
import {
  Heart,
  LayoutDashboard,
  PlusCircle,
  Stethoscope,
  Pill,
  Scissors,
  UtensilsCrossed,
  Settings,
  Menu,
  X,
  ChevronDown,
  LogOut,
  CheckSquare
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { scheduleAutoPurge } from "../components/utils/taskPurge";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "My Pets",
    url: createPageUrl("Pets"),
    icon: Heart,
  },
  {
    title: "Vet Visits",
    url: createPageUrl("VetVisits"),
    icon: Stethoscope,
  },
  {
    title: "Medications",
    url: createPageUrl("Medications"),
    icon: Pill,
  },
  {
    title: "Grooming",
    url: createPageUrl("Grooming"),
    icon: Scissors,
  },
  {
    title: "Feeding",
    url: createPageUrl("Feeding"),
    icon: UtensilsCrossed,
  },
  {
    title: "Tasks",
    url: createPageUrl("Tasks"),
    icon: CheckSquare,
  }
];

export default function Layout({ children }) {
  const location = useLocation();
  const [pets, setPets] = useState([]);
  const [activePet, setActivePet] = useState(null);
  const [user, setUser] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      const petData = await Pet.filter({ created_by: userData.email }, '-created_date');
      setPets(petData);
      
      if (petData.length > 0 && !activePet) {
        setActivePet(petData[0]);
      }
      
      // Schedule auto-purge on app load
      scheduleAutoPurge();

    } catch (error) {
      console.error("Error loading data:", error);
    }
  }, [activePet]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = async () => {
    await User.logout();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-orange-50 to-pink-50">
        <Sidebar className="border-r border-orange-200">
          <SidebarHeader className="border-b border-orange-200 p-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-pink-400 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Pet Log</h2>
                <p className="text-xs text-orange-600 font-medium">Queenie Edition</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-2">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2 py-2">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-orange-50 hover:text-orange-700 transition-colors duration-200 rounded-lg mb-1 ${
                          location.pathname === item.url ? 'bg-orange-100 text-orange-700' : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-2">
                          <item.icon className="w-4 h-4" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2 py-2">
                Active Pet
              </SidebarGroupLabel>
              <SidebarGroupContent>
                {activePet ? (
                  <div className="px-3 py-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between h-auto p-2">
                          <div className="flex items-center gap-2">
                            {activePet.photoUrl ? (
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={activePet.photoUrl} />
                                <AvatarFallback>{activePet.name[0]}</AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center">
                                <span className="text-orange-700 font-medium text-xs">
                                  {activePet.name[0]}
                                </span>
                              </div>
                            )}
                            <span className="font-medium text-sm">{activePet.name}</span>
                          </div>
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {pets.map((pet) => (
                          <DropdownMenuItem
                            key={pet.id}
                            onClick={() => setActivePet(pet)}
                          >
                            <div className="flex items-center gap-2">
                              {pet.photoUrl ? (
                                <Avatar className="w-5 h-5">
                                  <AvatarImage src={pet.photoUrl} />
                                  <AvatarFallback>{pet.name[0]}</AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="w-5 h-5 bg-orange-200 rounded-full flex items-center justify-center">
                                  <span className="text-orange-700 font-medium text-xs">
                                    {pet.name[0]}
                                  </span>
                                </div>
                              )}
                              {pet.name}
                              {activePet && pet.id === activePet.id && (
                                <Badge variant="secondary" className="ml-auto text-xs">Active</Badge>
                              )}
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <div className="px-3 py-2">
                    <Link to={createPageUrl("Pets")}>
                      <Button variant="outline" className="w-full text-sm">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Add First Pet
                      </Button>
                    </Link>
                  </div>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-orange-200 p-4">
            <div className="space-y-2">
              <Link to={createPageUrl("Settings")}>
                <Button variant="ghost" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="bg-orange-200 text-orange-700">
                            {user.full_name?.[0] || user.email[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate">{user.full_name || user.email}</span>
                      </div>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 backdrop-blur-sm border-b border-orange-200 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-orange-50 hover:text-orange-700 p-2 rounded-lg transition-colors duration-200" />
              <h1 className="text-xl font-bold">Pet Log</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

