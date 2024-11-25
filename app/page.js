"use client";

import React, { useState, useEffect } from 'react';
import { Terminal, Sun, Moon, Filter, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const services = ['user-service', 'auth-service', 'payment-service', 'order-service'];
const logLevels = ['info', 'warn', 'error', 'debug'];
const randomMessages = [
  'User login successful',
  'Failed to process payment',
  'New order created',
  'Database connection timeout',
  'Cache miss for key',
  'Rate limit exceeded',
  'API request completed',
  'Session expired',
  'Invalid credentials provided',
  'Resource not found'
];

const LoggerDashboard = () => {
  const [logs, setLogs] = useState([]);
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [terminalInput, setTerminalInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    services: new Set(services),
    levels: new Set(logLevels)
  });
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, setTheme } = useTheme();

  // Generate a random log entry
  const generateRandomLog = () => {
    const service = services[Math.floor(Math.random() * services.length)];
    const level = logLevels[Math.floor(Math.random() * logLevels.length)];
    const message = randomMessages[Math.floor(Math.random() * randomMessages.length)];
    return { service, level, message };
  };

  // Send log to backend
  const sendLog = async (logData) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      });

      if (response.ok) {
        const newLog = { ...logData, timestamp: new Date().toISOString() };
        setLogs(prev => [...prev, newLog]);
        toast.success('Log entry created successfully');
      } else {
        throw new Error('Failed to send log');
      }
    } catch (error) {
      console.error('Failed to send log:', error);
      toast.error('Failed to create log entry');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter logs based on current filters and search query
  const filteredLogs = logs.filter(log =>
    filters.services.has(log.service) &&
    filters.levels.has(log.level) &&
    (searchQuery === '' ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.service.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle terminal command execution
  const handleTerminalSubmit = (e) => {
    e.preventDefault();
    const command = terminalInput.trim().toLowerCase();

    switch (command) {
      case 'clear':
        setLogs([]);
        toast.info('Logs cleared');
        break;
      case 'generate':
        setAutoGenerate(prev => !prev);
        toast.info(`Auto-generate ${!autoGenerate ? 'started' : 'stopped'}`);
        break;
      default:
        const [service, level, ...messageParts] = terminalInput.split(' ');
        const message = messageParts.join(' ');

        if (service && level && message) {
          if (services.includes(service) && logLevels.includes(level)) {
            sendLog({ service, level, message });
          } else {
            toast.error('Invalid service or log level');
          }
        } else {
          toast.error('Invalid command format');
        }
    }
    setTerminalInput('');
  };

  // Auto-generate logs
  useEffect(() => {
    let interval;
    if (autoGenerate) {
      interval = setInterval(() => {
        sendLog(generateRandomLog());
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [autoGenerate]);

  // Get log color based on level
  const getLogColor = (level) => {
    switch (level) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="w-6 h-6" />
              <CardTitle>Kafka Logger Dashboard</CardTitle>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Services</h4>
                    <div className="space-y-2">
                      {services.map(service => (
                        <div key={service} className="flex items-center space-x-2">
                          <Checkbox
                            checked={filters.services.has(service)}
                            onCheckedChange={(checked) => {
                              const newServices = new Set(filters.services);
                              checked ? newServices.add(service) : newServices.delete(service);
                              setFilters(prev => ({ ...prev, services: newServices }));
                            }}
                          />
                          <span>{service}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Log Levels</h4>
                    <div className="space-y-2">
                      {logLevels.map(level => (
                        <div key={level} className="flex items-center space-x-2">
                          <Checkbox
                            checked={filters.levels.has(level)}
                            onCheckedChange={(checked) => {
                              const newLevels = new Set(filters.levels);
                              checked ? newLevels.add(level) : newLevels.delete(level);
                              setFilters(prev => ({ ...prev, levels: newLevels }));
                            }}
                          />
                          <span>{level}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Tabs defaultValue="terminal" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="terminal">Terminal</TabsTrigger>
              <TabsTrigger value="form">Form</TabsTrigger>
            </TabsList>

            <TabsContent value="terminal">
              <Card>
                <CardContent className="p-4">
                  <ScrollArea className="h-96 w-full rounded-md border bg-black p-4 font-mono">
                    {filteredLogs.map((log, index) => (
                      <div key={index} className="mb-2">
                        <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <Badge variant="outline" className="ml-2 text-green-500">
                          {log.service}
                        </Badge>
                        <Badge variant="outline" className={`ml-2 ${getLogColor(log.level)}`}>
                          {log.level}
                        </Badge>
                        <span className="text-gray-300 ml-2">{log.message}</span>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex items-center space-x-2 text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Processing...</span>
                      </div>
                    )}
                  </ScrollArea>
                  <form onSubmit={handleTerminalSubmit} className="mt-4 flex items-center space-x-2">
                    <span className="text-green-500">$</span>
                    <Input
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      className="flex-1 bg-black"
                      placeholder="service level message (or 'generate' to toggle auto-gen, 'clear' to reset)"
                      disabled={isLoading}
                    />
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="form">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      sendLog({
                        service: formData.get('service'),
                        level: formData.get('level'),
                        message: formData.get('message'),
                      });
                      e.target.reset();
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Service</label>
                      <Select name="service" defaultValue={services[0]} disabled={isLoading}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map(service => (
                            <SelectItem key={service} value={service}>
                              {service}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Level</label>
                      <Select name="level" defaultValue={logLevels[0]} disabled={isLoading}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {logLevels.map(level => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Message</label>
                      <Input
                        type="text"
                        name="message"
                        placeholder="Enter log message"
                        disabled={isLoading}
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Log'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between items-center mt-4">
            <Button
              variant={autoGenerate ? "destructive" : "default"}
              onClick={() => setAutoGenerate(!autoGenerate)}
              disabled={isLoading}
            >
              {autoGenerate ? 'Stop Auto-Generate' : 'Start Auto-Generate'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setLogs([]);
                toast.info('Logs cleared');
              }}
              disabled={isLoading}
            >
              Clear Logs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoggerDashboard;