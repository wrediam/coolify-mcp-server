#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosInstance } from 'axios';

interface CoolifyConfig {
  baseUrl: string;
  token: string;
}

class CoolifyServer {
  private server: Server;
  private axiosInstance: AxiosInstance | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'coolify-mcp-server',
        version: '4.3.1',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private initializeAxios(config: CoolifyConfig) {
    this.axiosInstance = axios.create({
      baseURL: `${config.baseUrl}/api/v1`,
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          const message = `Rate limit exceeded. ${retryAfter ? `Retry after ${retryAfter} seconds.` : 'Please wait before making more requests.'}`;
          throw new McpError(ErrorCode.InternalError, `Coolify API rate limit: ${message}`);
        }
        return Promise.reject(error);
      }
    );
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // ── General ──────────────────────────────────────────────────────────
        {
          name: 'get_version',
          description: 'Get the Coolify version string (e.g. "4.3.1").',
          inputSchema: { type: 'object', properties: {}, required: [] }
        },
        {
          name: 'health_check',
          description: 'Healthcheck endpoint. Does not require authentication. Returns "OK" when the API is up.',
          inputSchema: { type: 'object', properties: {}, required: [] }
        },
        {
          name: 'enable_api',
          description: 'Enable the Coolify API. Requires root-level token and Coolify >= 4.2.0.',
          inputSchema: { type: 'object', properties: {}, required: [] }
        },
        {
          name: 'disable_api',
          description: 'Disable the Coolify API. Requires root-level token and Coolify >= 4.2.0.',
          inputSchema: { type: 'object', properties: {}, required: [] }
        },
        {
          name: 'enable_mcp',
          description: 'Enable the built-in Coolify MCP server endpoint at /mcp. Requires root-level token.',
          inputSchema: { type: 'object', properties: {}, required: [] }
        },
        {
          name: 'disable_mcp',
          description: 'Disable the built-in Coolify MCP server endpoint at /mcp. Requires root-level token.',
          inputSchema: { type: 'object', properties: {}, required: [] }
        },

        // ── Teams ─────────────────────────────────────────────────────────────
        {
          name: 'list_teams',
          description: 'List all teams the authenticated token has access to.',
          inputSchema: { type: 'object', properties: {}, required: [] }
        },
        {
          name: 'get_team',
          description: 'Get details of a specific team by its numeric ID.',
          inputSchema: {
            type: 'object',
            properties: {
              team_id: { type: 'string', description: 'Numeric team ID (e.g. "0", "1").' }
            },
            required: ['team_id']
          }
        },
        {
          name: 'get_team_members',
          description: 'Get members of a specific team by its numeric ID.',
          inputSchema: {
            type: 'object',
            properties: {
              team_id: { type: 'string', description: 'Numeric team ID.' }
            },
            required: ['team_id']
          }
        },
        {
          name: 'get_current_team',
          description: 'Get the team associated with the current API token.',
          inputSchema: { type: 'object', properties: {}, required: [] }
        },
        {
          name: 'get_current_team_members',
          description: 'Get members of the current authenticated team.',
          inputSchema: { type: 'object', properties: {}, required: [] }
        },

        // ── Servers ───────────────────────────────────────────────────────────
        {
          name: 'list_servers',
          description: 'List all servers registered in Coolify.',
          inputSchema: { type: 'object', properties: {}, required: [] }
        },
        {
          name: 'get_server',
          description: 'Get details of a server by UUID.',
          inputSchema: {
            type: 'object',
            properties: { uuid: { type: 'string', description: 'Server UUID.' } },
            required: ['uuid']
          }
        },
        {
          name: 'create_server',
          description: 'Register a new server in Coolify.',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Human-readable name for the server.' },
              description: { type: 'string', description: 'Optional description.' },
              ip: { type: 'string', description: 'IP address of the server.' },
              port: { type: 'number', description: 'SSH port (default 22).', default: 22 },
              user: { type: 'string', description: 'SSH username (default root).', default: 'root' },
              private_key_uuid: { type: 'string', description: 'UUID of the private key for SSH auth.' },
              is_build_server: { type: 'boolean', description: 'Whether to use as a build server.', default: false },
              instant_validate: { type: 'boolean', description: 'Validate immediately after creation.', default: false },
              proxy_type: { type: 'string', enum: ['traefik', 'caddy', 'none'], description: 'Proxy type.', default: 'traefik' }
            },
            required: ['name', 'ip', 'port', 'user', 'private_key_uuid']
          }
        },
        {
          name: 'update_server',
          description: 'Update an existing server by UUID.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Server UUID.' },
              name: { type: 'string' },
              description: { type: 'string' },
              ip: { type: 'string' },
              port: { type: 'number' },
              user: { type: 'string' },
              private_key_uuid: { type: 'string' },
              is_build_server: { type: 'boolean' },
              instant_validate: { type: 'boolean' },
              proxy_type: { type: 'string', enum: ['traefik', 'caddy', 'none'] },
              concurrent_builds: { type: 'number' },
              dynamic_timeout: { type: 'number' },
              deployment_queue_limit: { type: 'number' }
            },
            required: ['uuid']
          }
        },
        {
          name: 'delete_server',
          description: 'Delete a server by UUID.',
          inputSchema: {
            type: 'object',
            properties: { uuid: { type: 'string', description: 'Server UUID.' } },
            required: ['uuid']
          }
        },
        {
          name: 'validate_server',
          description: 'Validate server connectivity and configuration. Requires Coolify >= 4.2.0.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Server UUID.' },
              install: { type: 'boolean', description: 'Also install Coolify prerequisites on the server.', default: false }
            },
            required: ['uuid']
          }
        },
        {
          name: 'get_server_resources',
          description: 'Get all resources (applications, databases, services) running on a server.',
          inputSchema: {
            type: 'object',
            properties: { uuid: { type: 'string', description: 'Server UUID.' } },
            required: ['uuid']
          }
        },
        {
          name: 'get_server_domains',
          description: 'Get all domains configured on a server.',
          inputSchema: {
            type: 'object',
            properties: { uuid: { type: 'string', description: 'Server UUID.' } },
            required: ['uuid']
          }
        },
        {
          name: 'create_hetzner_server',
          description: 'Create a Hetzner Cloud server and register it in Coolify.',
          inputSchema: {
            type: 'object',
            properties: {
              location: { type: 'string', description: 'Hetzner datacenter location (e.g. nbg1, fsn1, hel1).' },
              server_type: { type: 'string', description: 'Hetzner server type (e.g. cx11, cx21).' },
              image: { type: 'string', description: 'OS image name (e.g. ubuntu-22.04).' },
              private_key_uuid: { type: 'string', description: 'UUID of the private key for SSH auth.' },
              cloud_provider_token_uuid: { type: 'string', description: 'UUID of the Hetzner cloud token.' },
              name: { type: 'string', description: 'Optional server name.' },
              enable_ipv4: { type: 'boolean', default: true },
              enable_ipv6: { type: 'boolean', default: false },
              hetzner_ssh_key_ids: { type: 'array', items: { type: 'number' }, description: 'Hetzner SSH key IDs to attach.' },
              cloud_init_script: { type: 'string', description: 'Cloud-init script (base64 encoded).' },
              instant_validate: { type: 'boolean', default: false }
            },
            required: ['location', 'server_type', 'image', 'private_key_uuid']
          }
        },

        // ── Projects ──────────────────────────────────────────────────────────
        {
          name: 'list_projects',
          description: 'List all projects.',
          inputSchema: { type: 'object', properties: {}, required: [] }
        },
        {
          name: 'get_project',
          description: 'Get a project by UUID.',
          inputSchema: {
            type: 'object',
            properties: { project_uuid: { type: 'string', description: 'Project UUID.' } },
            required: ['project_uuid']
          }
        },
        {
          name: 'create_project',
          description: 'Create a new project.',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Project name.' },
              description: { type: 'string', description: 'Optional description.' }
            },
            required: ['name']
          }
        },
        {
          name: 'update_project',
          description: 'Update a project by UUID.',
          inputSchema: {
            type: 'object',
            properties: {
              project_uuid: { type: 'string', description: 'Project UUID.' },
              name: { type: 'string' },
              description: { type: 'string' }
            },
            required: ['project_uuid']
          }
        },
        {
          name: 'delete_project',
          description: 'Delete a project by UUID.',
          inputSchema: {
            type: 'object',
            properties: { project_uuid: { type: 'string', description: 'Project UUID.' } },
            required: ['project_uuid']
          }
        },

        // ── Environments ──────────────────────────────────────────────────────
        {
          name: 'list_environments',
          description: 'List all environments in a project.',
          inputSchema: {
            type: 'object',
            properties: { project_uuid: { type: 'string', description: 'Project UUID.' } },
            required: ['project_uuid']
          }
        },
        {
          name: 'get_environment',
          description: 'Get an environment by name or UUID within a project.',
          inputSchema: {
            type: 'object',
            properties: {
              project_uuid: { type: 'string', description: 'Project UUID.' },
              environment_name_or_uuid: { type: 'string', description: 'Environment name or UUID.' }
            },
            required: ['project_uuid', 'environment_name_or_uuid']
          }
        },
        {
          name: 'create_environment',
          description: 'Create a new environment within a project.',
          inputSchema: {
            type: 'object',
            properties: {
              project_uuid: { type: 'string', description: 'Project UUID.' },
              name: { type: 'string', description: 'Environment name (e.g. production, staging).' }
            },
            required: ['project_uuid', 'name']
          }
        },
        {
          name: 'delete_environment',
          description: 'Delete an environment (must be empty) from a project.',
          inputSchema: {
            type: 'object',
            properties: {
              project_uuid: { type: 'string', description: 'Project UUID.' },
              environment_name_or_uuid: { type: 'string', description: 'Environment name or UUID.' }
            },
            required: ['project_uuid', 'environment_name_or_uuid']
          }
        },

        // ── Applications ──────────────────────────────────────────────────────
        {
          name: 'list_applications',
          description: 'List all applications. Optionally filter by tag.',
          inputSchema: {
            type: 'object',
            properties: {
              tag: { type: 'string', description: 'Optional tag name to filter results.' }
            },
            required: []
          }
        },
        {
          name: 'get_application',
          description: 'Get an application by UUID.',
          inputSchema: {
            type: 'object',
            properties: { uuid: { type: 'string', description: 'Application UUID.' } },
            required: ['uuid']
          }
        },
        {
          name: 'create_public_application',
          description: 'Create an application from a public Git repository.',
          inputSchema: {
            type: 'object',
            properties: {
              project_uuid: { type: 'string' },
              server_uuid: { type: 'string' },
              environment_name: { type: 'string', description: 'Required if environment_uuid not provided.' },
              environment_uuid: { type: 'string', description: 'Required if environment_name not provided.' },
              git_repository: { type: 'string', description: 'Public Git repo URL.' },
              git_branch: { type: 'string', description: 'Git branch to deploy.' },
              build_pack: { type: 'string', enum: ['nixpacks', 'railpack', 'static', 'dockerfile', 'dockercompose'] },
              ports_exposes: { type: 'string', description: 'Comma-separated ports to expose (e.g. "3000").' },
              name: { type: 'string' },
              description: { type: 'string' },
              domains: { type: 'string' },
              destination_uuid: { type: 'string' },
              instant_deploy: { type: 'boolean', default: false },
              install_command: { type: 'string' },
              build_command: { type: 'string' },
              start_command: { type: 'string' },
              base_directory: { type: 'string' },
              publish_directory: { type: 'string' }
            },
            required: ['project_uuid', 'server_uuid', 'git_repository', 'git_branch', 'build_pack', 'ports_exposes']
          }
        },
        {
          name: 'create_private_github_app_application',
          description: 'Create an application from a private GitHub repository using a GitHub App.',
          inputSchema: {
            type: 'object',
            properties: {
              project_uuid: { type: 'string' },
              server_uuid: { type: 'string' },
              environment_name: { type: 'string' },
              environment_uuid: { type: 'string' },
              github_app_uuid: { type: 'string', description: 'UUID of the GitHub App.' },
              git_repository: { type: 'string' },
              git_branch: { type: 'string' },
              build_pack: { type: 'string', enum: ['nixpacks', 'railpack', 'static', 'dockerfile', 'dockercompose'] },
              ports_exposes: { type: 'string' },
              name: { type: 'string' },
              instant_deploy: { type: 'boolean', default: false }
            },
            required: ['project_uuid', 'server_uuid', 'github_app_uuid', 'git_repository', 'git_branch', 'build_pack', 'ports_exposes']
          }
        },
        {
          name: 'create_private_deploy_key_application',
          description: 'Create an application from a private repository using a Deploy Key.',
          inputSchema: {
            type: 'object',
            properties: {
              project_uuid: { type: 'string' },
              server_uuid: { type: 'string' },
              environment_name: { type: 'string' },
              environment_uuid: { type: 'string' },
              private_key_uuid: { type: 'string', description: 'UUID of the deploy key.' },
              git_repository: { type: 'string' },
              git_branch: { type: 'string' },
              build_pack: { type: 'string', enum: ['nixpacks', 'railpack', 'static', 'dockerfile', 'dockercompose'] },
              ports_exposes: { type: 'string' },
              name: { type: 'string' },
              instant_deploy: { type: 'boolean', default: false }
            },
            required: ['project_uuid', 'server_uuid', 'private_key_uuid', 'git_repository', 'git_branch', 'build_pack', 'ports_exposes']
          }
        },
        {
          name: 'create_dockerfile_application',
          description: 'Create an application from a Dockerfile (no Git).',
          inputSchema: {
            type: 'object',
            properties: {
              project_uuid: { type: 'string' },
              server_uuid: { type: 'string' },
              environment_name: { type: 'string' },
              environment_uuid: { type: 'string' },
              dockerfile: { type: 'string', description: 'Dockerfile content.' },
              name: { type: 'string' },
              ports_exposes: { type: 'string' },
              instant_deploy: { type: 'boolean', default: false }
            },
            required: ['project_uuid', 'server_uuid', 'dockerfile']
          }
        },
        {
          name: 'create_dockerimage_application',
          description: 'Create an application from a prebuilt Docker image.',
          inputSchema: {
            type: 'object',
            properties: {
              project_uuid: { type: 'string' },
              server_uuid: { type: 'string' },
              environment_name: { type: 'string' },
              environment_uuid: { type: 'string' },
              docker_registry_image_name: { type: 'string', description: 'Docker image name (e.g. nginx:latest).' },
              ports_exposes: { type: 'string' },
              name: { type: 'string' },
              instant_deploy: { type: 'boolean', default: false }
            },
            required: ['project_uuid', 'server_uuid', 'docker_registry_image_name', 'ports_exposes']
          }
        },
        {
          name: 'update_application',
          description: 'Update an application by UUID.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Application UUID.' },
              name: { type: 'string' },
              description: { type: 'string' },
              domains: { type: 'string' },
              git_branch: { type: 'string' },
              build_pack: { type: 'string', enum: ['nixpacks', 'railpack', 'static', 'dockerfile', 'dockercompose'] },
              install_command: { type: 'string' },
              build_command: { type: 'string' },
              start_command: { type: 'string' },
              ports_exposes: { type: 'string' },
              base_directory: { type: 'string' },
              publish_directory: { type: 'string' },
              is_auto_deploy_enabled: { type: 'boolean' }
            },
            required: ['uuid']
          }
        },
        {
          name: 'delete_application',
          description: 'Delete an application by UUID.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Application UUID.' },
              delete_configurations: { type: 'boolean', default: true },
              delete_volumes: { type: 'boolean', default: true },
              docker_cleanup: { type: 'boolean', default: true },
              delete_connected_networks: { type: 'boolean', default: true }
            },
            required: ['uuid']
          }
        },
        {
          name: 'start_application',
          description: 'Start an application.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Application UUID.' },
              force: { type: 'boolean', default: false },
              instant_deploy: { type: 'boolean', default: false }
            },
            required: ['uuid']
          }
        },
        {
          name: 'stop_application',
          description: 'Stop a running application.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Application UUID.' },
              docker_cleanup: { type: 'boolean', default: true }
            },
            required: ['uuid']
          }
        },
        {
          name: 'restart_application',
          description: 'Restart an application.',
          inputSchema: {
            type: 'object',
            properties: { uuid: { type: 'string', description: 'Application UUID.' } },
            required: ['uuid']
          }
        },
        {
          name: 'get_application_logs',
          description: 'Get application logs.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Application UUID.' },
              lines: { type: 'number', description: 'Number of log lines to return (default 100).', default: 100 }
            },
            required: ['uuid']
          }
        },
        // Application Envs
        {
          name: 'list_application_envs',
          description: 'List all environment variables for an application.',
          inputSchema: {
            type: 'object',
            properties: { uuid: { type: 'string', description: 'Application UUID.' } },
            required: ['uuid']
          }
        },
        {
          name: 'create_application_env',
          description: 'Create an environment variable for an application.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Application UUID.' },
              key: { type: 'string' },
              value: { type: 'string' },
              is_preview: { type: 'boolean', default: false },
              is_literal: { type: 'boolean', default: false },
              is_multiline: { type: 'boolean', default: false },
              is_shown_once: { type: 'boolean', default: false }
            },
            required: ['uuid', 'key', 'value']
          }
        },
        {
          name: 'update_application_env',
          description: 'Update an environment variable for an application.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Application UUID.' },
              key: { type: 'string' },
              value: { type: 'string' },
              is_preview: { type: 'boolean' },
              is_literal: { type: 'boolean' },
              is_multiline: { type: 'boolean' },
              is_shown_once: { type: 'boolean' }
            },
            required: ['uuid', 'key', 'value']
          }
        },
        {
          name: 'bulk_update_application_envs',
          description: 'Bulk update environment variables for an application.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Application UUID.' },
              data: {
                type: 'array',
                description: 'Array of env var objects with key, value, and optional flags.',
                items: {
                  type: 'object',
                  properties: {
                    key: { type: 'string' },
                    value: { type: 'string' },
                    is_preview: { type: 'boolean' },
                    is_literal: { type: 'boolean' },
                    is_multiline: { type: 'boolean' },
                    is_shown_once: { type: 'boolean' }
                  },
                  required: ['key', 'value']
                }
              }
            },
            required: ['uuid', 'data']
          }
        },
        {
          name: 'delete_application_env',
          description: 'Delete an environment variable from an application.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Application UUID.' },
              env_uuid: { type: 'string', description: 'Environment variable UUID.' }
            },
            required: ['uuid', 'env_uuid']
          }
        },
        // Application Storages
        {
          name: 'list_application_storages',
          description: 'List all persistent and file storages for an application.',
          inputSchema: {
            type: 'object',
            properties: { uuid: { type: 'string', description: 'Application UUID.' } },
            required: ['uuid']
          }
        },
        {
          name: 'create_application_storage',
          description: 'Create a storage for an application.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Application UUID.' },
              type: { type: 'string', enum: ['persistent', 'file'], description: 'Storage type.' },
              mount_path: { type: 'string', description: 'Container mount path.' },
              name: { type: 'string' },
              host_path: { type: 'string' },
              content: { type: 'string' },
              is_directory: { type: 'boolean' }
            },
            required: ['uuid', 'type', 'mount_path']
          }
        },
        {
          name: 'delete_application_storage',
          description: 'Delete a storage from an application.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Application UUID.' },
              storage_uuid: { type: 'string', description: 'Storage UUID.' }
            },
            required: ['uuid', 'storage_uuid']
          }
        },
        // Application Scheduled Tasks
        {
          name: 'list_application_scheduled_tasks',
          description: 'List all scheduled tasks for an application.',
          inputSchema: {
            type: 'object',
            properties: { uuid: { type: 'string', description: 'Application UUID.' } },
            required: ['uuid']
          }
        },
        {
          name: 'create_application_scheduled_task',
          description: 'Create a scheduled task for an application.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Application UUID.' },
              name: { type: 'string' },
              command: { type: 'string' },
              frequency: { type: 'string', description: 'Cron expression or keyword (hourly, daily, weekly, monthly).' },
              container: { type: 'string' },
              timeout: { type: 'number', default: 300 },
              enabled: { type: 'boolean', default: true }
            },
            required: ['uuid', 'name', 'command', 'frequency']
          }
        },
        {
          name: 'delete_application_scheduled_task',
          description: 'Delete a scheduled task from an application.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Application UUID.' },
              task_uuid: { type: 'string', description: 'Scheduled task UUID.' }
            },
            required: ['uuid', 'task_uuid']
          }
        },

        // ── Databases ─────────────────────────────────────────────────────────
        {
          name: 'list_databases',
          description: 'List all databases.',
          inputSchema: { type: 'object', properties: {}, required: [] }
        },
        {
          name: 'get_database',
          description: 'Get a database by UUID.',
          inputSchema: {
            type: 'object',
            properties: { uuid: { type: 'string', description: 'Database UUID.' } },
            required: ['uuid']
          }
        },
        {
          name: 'update_database',
          description: 'Update a database by UUID.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Database UUID.' },
              name: { type: 'string' },
              description: { type: 'string' },
              image: { type: 'string' },
              is_public: { type: 'boolean' },
              public_port: { type: 'number' }
            },
            required: ['uuid']
          }
        },
        {
          name: 'delete_database',
          description: 'Delete a database by UUID.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Database UUID.' },
              delete_configurations: { type: 'boolean', default: true },
              delete_volumes: { type: 'boolean', default: true },
              docker_cleanup: { type: 'boolean', default: true },
              delete_connected_networks: { type: 'boolean', default: true }
            },
            required: ['uuid']
          }
        },
        {
          name: 'create_postgresql_database',
          description: 'Create a PostgreSQL database.',
          inputSchema: {
            type: 'object',
            properties: {
              server_uuid: { type: 'string' },
              project_uuid: { type: 'string' },
              environment_name: { type: 'string' },
              environment_uuid: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              postgres_user: { type: 'string' },
              postgres_password: { type: 'string' },
              postgres_db: { type: 'string' },
              image: { type: 'string' },
              is_public: { type: 'boolean', default: false },
              public_port: { type: 'number' },
              instant_deploy: { type: 'boolean', default: false }
            },
            required: ['server_uuid', 'project_uuid']
          }
        },
        {
          name: 'create_mysql_database',
          description: 'Create a MySQL database.',
          inputSchema: {
            type: 'object',
            properties: {
              server_uuid: { type: 'string' },
              project_uuid: { type: 'string' },
              environment_name: { type: 'string' },
              environment_uuid: { type: 'string' },
              name: { type: 'string' },
              mysql_root_password: { type: 'string' },
              mysql_user: { type: 'string' },
              mysql_password: { type: 'string' },
              mysql_database: { type: 'string' },
              image: { type: 'string' },
              is_public: { type: 'boolean', default: false },
              instant_deploy: { type: 'boolean', default: false }
            },
            required: ['server_uuid', 'project_uuid']
          }
        },
        {
          name: 'create_mariadb_database',
          description: 'Create a MariaDB database.',
          inputSchema: {
            type: 'object',
            properties: {
              server_uuid: { type: 'string' },
              project_uuid: { type: 'string' },
              environment_name: { type: 'string' },
              environment_uuid: { type: 'string' },
              name: { type: 'string' },
              mariadb_root_password: { type: 'string' },
              mariadb_user: { type: 'string' },
              mariadb_password: { type: 'string' },
              mariadb_database: { type: 'string' },
              image: { type: 'string' },
              is_public: { type: 'boolean', default: false },
              instant_deploy: { type: 'boolean', default: false }
            },
            required: ['server_uuid', 'project_uuid']
          }
        },
        {
          name: 'create_mongodb_database',
          description: 'Create a MongoDB database.',
          inputSchema: {
            type: 'object',
            properties: {
              server_uuid: { type: 'string' },
              project_uuid: { type: 'string' },
              environment_name: { type: 'string' },
              environment_uuid: { type: 'string' },
              name: { type: 'string' },
              mongo_initdb_root_username: { type: 'string' },
              mongo_initdb_root_password: { type: 'string' },
              image: { type: 'string' },
              is_public: { type: 'boolean', default: false },
              instant_deploy: { type: 'boolean', default: false }
            },
            required: ['server_uuid', 'project_uuid']
          }
        },
        {
          name: 'create_redis_database',
          description: 'Create a Redis database.',
          inputSchema: {
            type: 'object',
            properties: {
              server_uuid: { type: 'string' },
              project_uuid: { type: 'string' },
              environment_name: { type: 'string' },
              environment_uuid: { type: 'string' },
              name: { type: 'string' },
              redis_password: { type: 'string' },
              image: { type: 'string' },
              is_public: { type: 'boolean', default: false },
              instant_deploy: { type: 'boolean', default: false }
            },
            required: ['server_uuid', 'project_uuid']
          }
        },
        {
          name: 'create_keydb_database',
          description: 'Create a KeyDB database.',
          inputSchema: {
            type: 'object',
            properties: {
              server_uuid: { type: 'string' },
              project_uuid: { type: 'string' },
              environment_name: { type: 'string' },
              environment_uuid: { type: 'string' },
              name: { type: 'string' },
              keydb_password: { type: 'string' },
              image: { type: 'string' },
              is_public: { type: 'boolean', default: false },
              instant_deploy: { type: 'boolean', default: false }
            },
            required: ['server_uuid', 'project_uuid']
          }
        },
        {
          name: 'create_dragonfly_database',
          description: 'Create a DragonFly database.',
          inputSchema: {
            type: 'object',
            properties: {
              server_uuid: { type: 'string' },
              project_uuid: { type: 'string' },
              environment_name: { type: 'string' },
              environment_uuid: { type: 'string' },
              name: { type: 'string' },
              dragonfly_password: { type: 'string' },
              image: { type: 'string' },
              is_public: { type: 'boolean', default: false },
              instant_deploy: { type: 'boolean', default: false }
            },
            required: ['server_uuid', 'project_uuid']
          }
        },
        {
          name: 'create_clickhouse_database',
          description: 'Create a Clickhouse database.',
          inputSchema: {
            type: 'object',
            properties: {
              server_uuid: { type: 'string' },
              project_uuid: { type: 'string' },
              environment_name: { type: 'string' },
              environment_uuid: { type: 'string' },
              name: { type: 'string' },
              clickhouse_admin_user: { type: 'string' },
              clickhouse_admin_password: { type: 'string' },
              image: { type: 'string' },
              is_public: { type: 'boolean', default: false },
              instant_deploy: { type: 'boolean', default: false }
            },
            required: ['server_uuid', 'project_uuid']
          }
        },
        {
          name: 'start_database',
          description: 'Start a database.',
          inputSchema: {
            type: 'object',
            properties: { uuid: { type: 'string', description: 'Database UUID.' } },
            required: ['uuid']
          }
        },
        {
          name: 'stop_database',
          description: 'Stop a database.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Database UUID.' },
              docker_cleanup: { type: 'boolean', default: true }
            },
            required: ['uuid']
          }
        },
        {
          name: 'restart_database',
          description: 'Restart a database.',
          inputSchema: {
            type: 'object',
            properties: { uuid: { type: 'string', description: 'Database UUID.' } },
            required: ['uuid']
          }
        },
        // Database Backups
        {
          name: 'get_database_backups',
          description: 'Get backup configurations for a database.',
          inputSchema: {
            type: 'object',
            properties: { uuid: { type: 'string', description: 'Database UUID.' } },
            required: ['uuid']
          }
        },
        {
          name: 'create_database_backup',
          description: 'Create a scheduled backup configuration for a database.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Database UUID.' },
              frequency: { type: 'string', description: 'Cron expression or keyword (every_minute, hourly, daily, weekly, monthly, yearly).' },
              enabled: { type: 'boolean', default: true },
              save_s3: { type: 'boolean', default: false },
              s3_storage_uuid: { type: 'string' },
              dump_all: { type: 'boolean', default: false },
              backup_now: { type: 'boolean', default: false }
            },
            required: ['uuid', 'frequency']
          }
        },
        {
          name: 'list_database_backup_executions',
          description: 'List all executions for a backup configuration.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Database UUID.' },
              scheduled_backup_uuid: { type: 'string', description: 'Scheduled backup UUID.' }
            },
            required: ['uuid', 'scheduled_backup_uuid']
          }
        },
        // Database Envs
        {
          name: 'list_database_envs',
          description: 'List environment variables for a database.',
          inputSchema: {
            type: 'object',
            properties: { uuid: { type: 'string', description: 'Database UUID.' } },
            required: ['uuid']
          }
        },
        {
          name: 'create_database_env',
          description: 'Create an environment variable for a database.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Database UUID.' },
              key: { type: 'string' },
              value: { type: 'string' }
            },
            required: ['uuid', 'key', 'value']
          }
        },
        {
          name: 'delete_database_env',
          description: 'Delete an environment variable from a database.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Database UUID.' },
              env_uuid: { type: 'string', description: 'Environment variable UUID.' }
            },
            required: ['uuid', 'env_uuid']
          }
        },

        // ── Services ──────────────────────────────────────────────────────────
        {
          name: 'list_services',
          description: 'List all services.',
          inputSchema: { type: 'object', properties: {}, required: [] }
        },
        {
          name: 'get_service',
          description: 'Get a service by UUID.',
          inputSchema: {
            type: 'object',
            properties: { uuid: { type: 'string', description: 'Service UUID.' } },
            required: ['uuid']
          }
        },
        {
          name: 'create_service',
          description: 'Create a one-click or custom service. Provide either "type" for a predefined service or "docker_compose_raw" for a custom one.',
          inputSchema: {
            type: 'object',
            properties: {
              server_uuid: { type: 'string' },
              project_uuid: { type: 'string' },
              environment_name: { type: 'string' },
              environment_uuid: { type: 'string' },
              type: { type: 'string', description: 'One-click service type (e.g. gitea, plausible, actualbudget).' },
              name: { type: 'string' },
              description: { type: 'string' },
              destination_uuid: { type: 'string' },
              instant_deploy: { type: 'boolean', default: false },
              docker_compose_raw: { type: 'string', description: 'Base64-encoded Docker Compose YAML for custom services.' }
            },
            required: ['server_uuid', 'project_uuid']
          }
        },
        {
          name: 'update_service',
          description: 'Update a service by UUID.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Service UUID.' },
              name: { type: 'string' },
              description: { type: 'string' },
              docker_compose_raw: { type: 'string' }
            },
            required: ['uuid']
          }
        },
        {
          name: 'delete_service',
          description: 'Delete a service by UUID.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Service UUID.' },
              delete_configurations: { type: 'boolean', default: true },
              delete_volumes: { type: 'boolean', default: true },
              docker_cleanup: { type: 'boolean', default: true },
              delete_connected_networks: { type: 'boolean', default: true }
            },
            required: ['uuid']
          }
        },
        {
          name: 'start_service',
          description: 'Start a service.',
          inputSchema: {
            type: 'object',
            properties: { uuid: { type: 'string', description: 'Service UUID.' } },
            required: ['uuid']
          }
        },
        {
          name: 'stop_service',
          description: 'Stop a service.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Service UUID.' },
              docker_cleanup: { type: 'boolean', default: true }
            },
            required: ['uuid']
          }
        },
        {
          name: 'restart_service',
          description: 'Restart a service.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Service UUID.' },
              latest: { type: 'boolean', description: 'Pull latest images before restart.', default: false }
            },
            required: ['uuid']
          }
        },
        // Service Envs
        {
          name: 'list_service_envs',
          description: 'List environment variables for a service.',
          inputSchema: {
            type: 'object',
            properties: { uuid: { type: 'string', description: 'Service UUID.' } },
            required: ['uuid']
          }
        },
        {
          name: 'create_service_env',
          description: 'Create an environment variable for a service.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Service UUID.' },
              key: { type: 'string' },
              value: { type: 'string' }
            },
            required: ['uuid', 'key', 'value']
          }
        },
        {
          name: 'delete_service_env',
          description: 'Delete an environment variable from a service.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Service UUID.' },
              env_uuid: { type: 'string', description: 'Environment variable UUID.' }
            },
            required: ['uuid', 'env_uuid']
          }
        },
        // Service Scheduled Tasks
        {
          name: 'list_service_scheduled_tasks',
          description: 'List all scheduled tasks for a service.',
          inputSchema: {
            type: 'object',
            properties: { uuid: { type: 'string', description: 'Service UUID.' } },
            required: ['uuid']
          }
        },
        {
          name: 'create_service_scheduled_task',
          description: 'Create a scheduled task for a service.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Service UUID.' },
              name: { type: 'string' },
              command: { type: 'string' },
              frequency: { type: 'string' },
              container: { type: 'string' },
              timeout: { type: 'number', default: 300 },
              enabled: { type: 'boolean', default: true }
            },
            required: ['uuid', 'name', 'command', 'frequency']
          }
        },
        {
          name: 'delete_service_scheduled_task',
          description: 'Delete a scheduled task from a service.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Service UUID.' },
              task_uuid: { type: 'string', description: 'Scheduled task UUID.' }
            },
            required: ['uuid', 'task_uuid']
          }
        },

        // ── Deployments ───────────────────────────────────────────────────────
        {
          name: 'list_deployments',
          description: 'List currently running deployments.',
          inputSchema: { type: 'object', properties: {}, required: [] }
        },
        {
          name: 'get_deployment',
          description: 'Get a deployment by UUID.',
          inputSchema: {
            type: 'object',
            properties: { uuid: { type: 'string', description: 'Deployment UUID.' } },
            required: ['uuid']
          }
        },
        {
          name: 'cancel_deployment',
          description: 'Cancel a running deployment by UUID.',
          inputSchema: {
            type: 'object',
            properties: { uuid: { type: 'string', description: 'Deployment UUID.' } },
            required: ['uuid']
          }
        },
        {
          name: 'list_deployments_by_application',
          description: 'List deployments for a specific application.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Application UUID.' },
              skip: { type: 'number', default: 0 },
              take: { type: 'number', default: 10 }
            },
            required: ['uuid']
          }
        },
        {
          name: 'deploy_by_tag_or_uuid',
          description: 'Trigger a deployment by tag or UUID. Supports force deploy and pull-request deployments.',
          inputSchema: {
            type: 'object',
            properties: {
              tag: { type: 'string', description: 'Comma-separated tag names to deploy.' },
              uuid: { type: 'string', description: 'Comma-separated resource UUIDs to deploy.' },
              force: { type: 'boolean', default: false },
              pr: { type: 'number', description: 'Pull request ID for PR deployments.' },
              docker_tag: { type: 'string', description: 'Docker image tag to deploy.' }
            },
            required: []
          }
        },

        // ── Private Keys ──────────────────────────────────────────────────────
        {
          name: 'list_private_keys',
          description: 'List all SSH private keys.',
          inputSchema: { type: 'object', properties: {}, required: [] }
        },
        {
          name: 'get_private_key',
          description: 'Get a private key by UUID.',
          inputSchema: {
            type: 'object',
            properties: { uuid: { type: 'string', description: 'Private key UUID.' } },
            required: ['uuid']
          }
        },
        {
          name: 'create_private_key',
          description: 'Create a new SSH private key.',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              private_key: { type: 'string', description: 'PEM-formatted private key content.' }
            },
            required: ['private_key']
          }
        },
        {
          name: 'update_private_key',
          description: 'Update an existing private key.',
          inputSchema: {
            type: 'object',
            properties: {
              uuid: { type: 'string', description: 'Private key UUID.' },
              name: { type: 'string' },
              description: { type: 'string' },
              private_key: { type: 'string' }
            },
            required: ['uuid', 'private_key']
          }
        },
        {
          name: 'delete_private_key',
          description: 'Delete a private key by UUID.',
          inputSchema: {
            type: 'object',
            properties: { uuid: { type: 'string', description: 'Private key UUID.' } },
            required: ['uuid']
          }
        },

        // ── GitHub Apps ───────────────────────────────────────────────────────
        {
          name: 'list_github_apps',
          description: 'List all configured GitHub Apps.',
          inputSchema: { type: 'object', properties: {}, required: [] }
        },
        {
          name: 'create_github_app',
          description: 'Create a new GitHub App integration.',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              api_url: { type: 'string' },
              html_url: { type: 'string' },
              app_id: { type: 'number' },
              installation_id: { type: 'number' },
              client_id: { type: 'string' },
              client_secret: { type: 'string' },
              private_key_uuid: { type: 'string' },
              organization: { type: 'string' },
              webhook_secret: { type: 'string' },
              is_system_wide: { type: 'boolean', default: false }
            },
            required: ['name', 'api_url', 'html_url', 'app_id', 'installation_id', 'client_id', 'client_secret', 'private_key_uuid']
          }
        },
        {
          name: 'delete_github_app',
          description: 'Delete a GitHub App (only if not used by any applications).',
          inputSchema: {
            type: 'object',
            properties: { github_app_id: { type: 'number', description: 'GitHub App numeric ID.' } },
            required: ['github_app_id']
          }
        },
        {
          name: 'list_github_app_repositories',
          description: 'List repositories accessible to a GitHub App.',
          inputSchema: {
            type: 'object',
            properties: { github_app_id: { type: 'number', description: 'GitHub App numeric ID.' } },
            required: ['github_app_id']
          }
        },

        // ── Cloud Tokens ──────────────────────────────────────────────────────
        {
          name: 'list_cloud_tokens',
          description: 'List all cloud provider tokens (Hetzner, DigitalOcean, etc.).',
          inputSchema: { type: 'object', properties: {}, required: [] }
        },
        {
          name: 'create_cloud_token',
          description: 'Create and validate a new cloud provider token.',
          inputSchema: {
            type: 'object',
            properties: {
              provider: { type: 'string', enum: ['hetzner', 'digitalocean'], description: 'Cloud provider.' },
              token: { type: 'string', description: 'API token for the cloud provider.' },
              name: { type: 'string', description: 'Human-readable name for this token.' }
            },
            required: ['provider', 'token', 'name']
          }
        },
        {
          name: 'delete_cloud_token',
          description: 'Delete a cloud provider token. Fails if used by any servers.',
          inputSchema: {
            type: 'object',
            properties: { uuid: { type: 'string', description: 'Cloud token UUID.' } },
            required: ['uuid']
          }
        },

        // ── Hetzner ───────────────────────────────────────────────────────────
        {
          name: 'get_hetzner_locations',
          description: 'Get all available Hetzner datacenter locations.',
          inputSchema: {
            type: 'object',
            properties: { cloud_provider_token_uuid: { type: 'string', description: 'Cloud token UUID.' } },
            required: ['cloud_provider_token_uuid']
          }
        },
        {
          name: 'get_hetzner_server_types',
          description: 'Get all available Hetzner server types and pricing.',
          inputSchema: {
            type: 'object',
            properties: { cloud_provider_token_uuid: { type: 'string', description: 'Cloud token UUID.' } },
            required: ['cloud_provider_token_uuid']
          }
        },
        {
          name: 'get_hetzner_images',
          description: 'Get all available Hetzner OS images.',
          inputSchema: {
            type: 'object',
            properties: { cloud_provider_token_uuid: { type: 'string', description: 'Cloud token UUID.' } },
            required: ['cloud_provider_token_uuid']
          }
        },
        {
          name: 'get_hetzner_ssh_keys',
          description: 'Get all SSH keys stored in a Hetzner account.',
          inputSchema: {
            type: 'object',
            properties: { cloud_provider_token_uuid: { type: 'string', description: 'Cloud token UUID.' } },
            required: ['cloud_provider_token_uuid']
          }
        },

        // ── Resources ─────────────────────────────────────────────────────────
        {
          name: 'list_resources',
          description: 'Get all resources (applications, databases, services) across the Coolify instance.',
          inputSchema: { type: 'object', properties: {}, required: [] }
        },
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (!this.axiosInstance) {
        throw new McpError(
          ErrorCode.InvalidRequest,
          'Coolify not configured. Set COOLIFY_BASE_URL and COOLIFY_TOKEN environment variables.'
        );
      }

      const args = request.params.arguments ?? {};

      try {
        switch (request.params.name) {

          // ── General ────────────────────────────────────────────────────────
          case 'get_version': {
            const r = await this.axiosInstance.get('/version');
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'health_check': {
            const r = await this.axiosInstance.get('/health');
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'enable_api': {
            const r = await this.axiosInstance.post('/enable');
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'disable_api': {
            const r = await this.axiosInstance.post('/disable');
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'enable_mcp': {
            const r = await this.axiosInstance.post('/mcp/enable');
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'disable_mcp': {
            const r = await this.axiosInstance.post('/mcp/disable');
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }

          // ── Teams ──────────────────────────────────────────────────────────
          case 'list_teams': {
            const r = await this.axiosInstance.get('/teams');
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'get_team': {
            if (!args.team_id) throw new McpError(ErrorCode.InvalidParams, 'team_id is required');
            const r = await this.axiosInstance.get(`/teams/${args.team_id}`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'get_team_members': {
            if (!args.team_id) throw new McpError(ErrorCode.InvalidParams, 'team_id is required');
            const r = await this.axiosInstance.get(`/teams/${args.team_id}/members`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'get_current_team': {
            const r = await this.axiosInstance.get('/teams/current');
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'get_current_team_members': {
            const r = await this.axiosInstance.get('/teams/current/members');
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }

          // ── Servers ────────────────────────────────────────────────────────
          case 'list_servers': {
            const r = await this.axiosInstance.get('/servers');
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'get_server': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const r = await this.axiosInstance.get(`/servers/${args.uuid}`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'create_server': {
            const r = await this.axiosInstance.post('/servers', args);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'update_server': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const { uuid: suuid, ...serverPatch } = args as Record<string, unknown>;
            const r = await this.axiosInstance.patch(`/servers/${suuid}`, serverPatch);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'delete_server': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const r = await this.axiosInstance.delete(`/servers/${args.uuid}`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'validate_server': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const { uuid: vsuuid, ...validateBody } = args as Record<string, unknown>;
            const r = await this.axiosInstance.post(`/servers/${vsuuid}/validate`, validateBody);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'get_server_resources': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const r = await this.axiosInstance.get(`/servers/${args.uuid}/resources`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'get_server_domains': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const r = await this.axiosInstance.get(`/servers/${args.uuid}/domains`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'create_hetzner_server': {
            const r = await this.axiosInstance.post('/servers/hetzner', args);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }

          // ── Projects ───────────────────────────────────────────────────────
          case 'list_projects': {
            const r = await this.axiosInstance.get('/projects');
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'get_project': {
            if (!args.project_uuid) throw new McpError(ErrorCode.InvalidParams, 'project_uuid is required');
            const r = await this.axiosInstance.get(`/projects/${args.project_uuid}`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'create_project': {
            const r = await this.axiosInstance.post('/projects', args);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'update_project': {
            if (!args.project_uuid) throw new McpError(ErrorCode.InvalidParams, 'project_uuid is required');
            const { project_uuid: puuid, ...projectPatch } = args as Record<string, unknown>;
            const r = await this.axiosInstance.patch(`/projects/${puuid}`, projectPatch);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'delete_project': {
            if (!args.project_uuid) throw new McpError(ErrorCode.InvalidParams, 'project_uuid is required');
            const r = await this.axiosInstance.delete(`/projects/${args.project_uuid}`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }

          // ── Environments ───────────────────────────────────────────────────
          case 'list_environments': {
            if (!args.project_uuid) throw new McpError(ErrorCode.InvalidParams, 'project_uuid is required');
            const r = await this.axiosInstance.get(`/projects/${args.project_uuid}/environments`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'get_environment': {
            if (!args.project_uuid) throw new McpError(ErrorCode.InvalidParams, 'project_uuid is required');
            if (!args.environment_name_or_uuid) throw new McpError(ErrorCode.InvalidParams, 'environment_name_or_uuid is required');
            const r = await this.axiosInstance.get(`/projects/${args.project_uuid}/${args.environment_name_or_uuid}`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'create_environment': {
            if (!args.project_uuid) throw new McpError(ErrorCode.InvalidParams, 'project_uuid is required');
            const { project_uuid: epuuid, ...envBody } = args as Record<string, unknown>;
            const r = await this.axiosInstance.post(`/projects/${epuuid}/environments`, envBody);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'delete_environment': {
            if (!args.project_uuid) throw new McpError(ErrorCode.InvalidParams, 'project_uuid is required');
            if (!args.environment_name_or_uuid) throw new McpError(ErrorCode.InvalidParams, 'environment_name_or_uuid is required');
            const r = await this.axiosInstance.delete(`/projects/${args.project_uuid}/environments/${args.environment_name_or_uuid}`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }

          // ── Applications ───────────────────────────────────────────────────
          case 'list_applications': {
            const r = await this.axiosInstance.get('/applications', { params: args.tag ? { tag: args.tag } : {} });
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'get_application': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const r = await this.axiosInstance.get(`/applications/${args.uuid}`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'create_public_application': {
            const r = await this.axiosInstance.post('/applications/public', args);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'create_private_github_app_application': {
            const r = await this.axiosInstance.post('/applications/private-github-app', args);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'create_private_deploy_key_application': {
            const r = await this.axiosInstance.post('/applications/private-deploy-key', args);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'create_dockerfile_application': {
            const r = await this.axiosInstance.post('/applications/dockerfile', args);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'create_dockerimage_application': {
            const r = await this.axiosInstance.post('/applications/dockerimage', args);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'update_application': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const { uuid: auuid, ...appPatch } = args as Record<string, unknown>;
            const r = await this.axiosInstance.patch(`/applications/${auuid}`, appPatch);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'delete_application': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const { uuid: dauuid, ...deleteParams } = args as Record<string, unknown>;
            const r = await this.axiosInstance.delete(`/applications/${dauuid}`, { params: deleteParams });
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'start_application': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const { uuid: sauuid, ...startBody } = args as Record<string, unknown>;
            const r = await this.axiosInstance.post(`/applications/${sauuid}/start`, startBody);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'stop_application': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const { uuid: stauuid, ...stopBody } = args as Record<string, unknown>;
            const r = await this.axiosInstance.post(`/applications/${stauuid}/stop`, stopBody);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'restart_application': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const r = await this.axiosInstance.post(`/applications/${args.uuid}/restart`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'get_application_logs': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const r = await this.axiosInstance.get(`/applications/${args.uuid}/logs`, { params: { lines: args.lines ?? 100 } });
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          // Application Envs
          case 'list_application_envs': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const r = await this.axiosInstance.get(`/applications/${args.uuid}/envs`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'create_application_env': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const { uuid: aeuuid, ...envBody } = args as Record<string, unknown>;
            const r = await this.axiosInstance.post(`/applications/${aeuuid}/envs`, envBody);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'update_application_env': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const { uuid: uaeuuid, ...envPatch } = args as Record<string, unknown>;
            const r = await this.axiosInstance.patch(`/applications/${uaeuuid}/envs`, envPatch);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'bulk_update_application_envs': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const { uuid: buuid, data } = args as Record<string, unknown>;
            const r = await this.axiosInstance.patch(`/applications/${buuid}/envs/bulk`, { data });
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'delete_application_env': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            if (!args.env_uuid) throw new McpError(ErrorCode.InvalidParams, 'env_uuid is required');
            const r = await this.axiosInstance.delete(`/applications/${args.uuid}/envs/${args.env_uuid}`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          // Application Storages
          case 'list_application_storages': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const r = await this.axiosInstance.get(`/applications/${args.uuid}/storages`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'create_application_storage': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const { uuid: astuuid, ...storageBody } = args as Record<string, unknown>;
            const r = await this.axiosInstance.post(`/applications/${astuuid}/storages`, storageBody);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'delete_application_storage': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            if (!args.storage_uuid) throw new McpError(ErrorCode.InvalidParams, 'storage_uuid is required');
            const r = await this.axiosInstance.delete(`/applications/${args.uuid}/storages/${args.storage_uuid}`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          // Application Scheduled Tasks
          case 'list_application_scheduled_tasks': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const r = await this.axiosInstance.get(`/applications/${args.uuid}/scheduled-tasks`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'create_application_scheduled_task': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const { uuid: atsuuid, ...taskBody } = args as Record<string, unknown>;
            const r = await this.axiosInstance.post(`/applications/${atsuuid}/scheduled-tasks`, taskBody);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'delete_application_scheduled_task': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            if (!args.task_uuid) throw new McpError(ErrorCode.InvalidParams, 'task_uuid is required');
            const r = await this.axiosInstance.delete(`/applications/${args.uuid}/scheduled-tasks/${args.task_uuid}`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }

          // ── Databases ──────────────────────────────────────────────────────
          case 'list_databases': {
            const r = await this.axiosInstance.get('/databases');
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'get_database': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const r = await this.axiosInstance.get(`/databases/${args.uuid}`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'update_database': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const { uuid: dbuuid, ...dbPatch } = args as Record<string, unknown>;
            const r = await this.axiosInstance.patch(`/databases/${dbuuid}`, dbPatch);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'delete_database': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const { uuid: deldbuuid, ...dbDeleteParams } = args as Record<string, unknown>;
            const r = await this.axiosInstance.delete(`/databases/${deldbuuid}`, { params: dbDeleteParams });
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'create_postgresql_database': {
            const r = await this.axiosInstance.post('/databases/postgresql', args);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'create_mysql_database': {
            const r = await this.axiosInstance.post('/databases/mysql', args);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'create_mariadb_database': {
            const r = await this.axiosInstance.post('/databases/mariadb', args);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'create_mongodb_database': {
            const r = await this.axiosInstance.post('/databases/mongodb', args);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'create_redis_database': {
            const r = await this.axiosInstance.post('/databases/redis', args);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'create_keydb_database': {
            const r = await this.axiosInstance.post('/databases/keydb', args);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'create_dragonfly_database': {
            const r = await this.axiosInstance.post('/databases/dragonfly', args);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'create_clickhouse_database': {
            const r = await this.axiosInstance.post('/databases/clickhouse', args);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'start_database': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const r = await this.axiosInstance.post(`/databases/${args.uuid}/start`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'stop_database': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const { uuid: stopdbuuid, ...stopDbBody } = args as Record<string, unknown>;
            const r = await this.axiosInstance.post(`/databases/${stopdbuuid}/stop`, stopDbBody);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'restart_database': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const r = await this.axiosInstance.post(`/databases/${args.uuid}/restart`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          // Database Backups
          case 'get_database_backups': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const r = await this.axiosInstance.get(`/databases/${args.uuid}/backups`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'create_database_backup': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const { uuid: bkuuid, ...backupBody } = args as Record<string, unknown>;
            const r = await this.axiosInstance.post(`/databases/${bkuuid}/backups`, backupBody);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'list_database_backup_executions': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            if (!args.scheduled_backup_uuid) throw new McpError(ErrorCode.InvalidParams, 'scheduled_backup_uuid is required');
            const r = await this.axiosInstance.get(`/databases/${args.uuid}/backups/${args.scheduled_backup_uuid}/executions`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          // Database Envs
          case 'list_database_envs': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const r = await this.axiosInstance.get(`/databases/${args.uuid}/envs`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'create_database_env': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const { uuid: dbenvuuid, ...dbEnvBody } = args as Record<string, unknown>;
            const r = await this.axiosInstance.post(`/databases/${dbenvuuid}/envs`, dbEnvBody);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'delete_database_env': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            if (!args.env_uuid) throw new McpError(ErrorCode.InvalidParams, 'env_uuid is required');
            const r = await this.axiosInstance.delete(`/databases/${args.uuid}/envs/${args.env_uuid}`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }

          // ── Services ───────────────────────────────────────────────────────
          case 'list_services': {
            const r = await this.axiosInstance.get('/services');
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'get_service': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const r = await this.axiosInstance.get(`/services/${args.uuid}`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'create_service': {
            const r = await this.axiosInstance.post('/services', args);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'update_service': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const { uuid: svuuid, ...svPatch } = args as Record<string, unknown>;
            const r = await this.axiosInstance.patch(`/services/${svuuid}`, svPatch);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'delete_service': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const { uuid: delsvuuid, ...svDeleteParams } = args as Record<string, unknown>;
            const r = await this.axiosInstance.delete(`/services/${delsvuuid}`, { params: svDeleteParams });
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'start_service': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const r = await this.axiosInstance.post(`/services/${args.uuid}/start`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'stop_service': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const { uuid: stsvuuid, ...stopSvBody } = args as Record<string, unknown>;
            const r = await this.axiosInstance.post(`/services/${stsvuuid}/stop`, stopSvBody);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'restart_service': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const { uuid: rsvuuid, ...restartSvBody } = args as Record<string, unknown>;
            const r = await this.axiosInstance.post(`/services/${rsvuuid}/restart`, restartSvBody);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          // Service Envs
          case 'list_service_envs': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const r = await this.axiosInstance.get(`/services/${args.uuid}/envs`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'create_service_env': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const { uuid: svenvuuid, ...svEnvBody } = args as Record<string, unknown>;
            const r = await this.axiosInstance.post(`/services/${svenvuuid}/envs`, svEnvBody);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'delete_service_env': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            if (!args.env_uuid) throw new McpError(ErrorCode.InvalidParams, 'env_uuid is required');
            const r = await this.axiosInstance.delete(`/services/${args.uuid}/envs/${args.env_uuid}`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          // Service Scheduled Tasks
          case 'list_service_scheduled_tasks': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const r = await this.axiosInstance.get(`/services/${args.uuid}/scheduled-tasks`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'create_service_scheduled_task': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const { uuid: ststuuid, ...stBody } = args as Record<string, unknown>;
            const r = await this.axiosInstance.post(`/services/${ststuuid}/scheduled-tasks`, stBody);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'delete_service_scheduled_task': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            if (!args.task_uuid) throw new McpError(ErrorCode.InvalidParams, 'task_uuid is required');
            const r = await this.axiosInstance.delete(`/services/${args.uuid}/scheduled-tasks/${args.task_uuid}`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }

          // ── Deployments ────────────────────────────────────────────────────
          case 'list_deployments': {
            const r = await this.axiosInstance.get('/deployments');
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'get_deployment': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const r = await this.axiosInstance.get(`/deployments/${args.uuid}`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'cancel_deployment': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const r = await this.axiosInstance.post(`/deployments/${args.uuid}/cancel`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'list_deployments_by_application': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const { uuid: appDeployUuid, ...deployParams } = args as Record<string, unknown>;
            const r = await this.axiosInstance.get(`/deployments/applications/${appDeployUuid}`, { params: deployParams });
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'deploy_by_tag_or_uuid': {
            const r = await this.axiosInstance.post('/deploy', args);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }

          // ── Private Keys ───────────────────────────────────────────────────
          case 'list_private_keys': {
            const r = await this.axiosInstance.get('/security/keys');
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'get_private_key': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const r = await this.axiosInstance.get(`/security/keys/${args.uuid}`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'create_private_key': {
            const r = await this.axiosInstance.post('/security/keys', args);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'update_private_key': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const { uuid: pkuuid, ...keyPatch } = args as Record<string, unknown>;
            const r = await this.axiosInstance.patch(`/security/keys/${pkuuid}`, keyPatch);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'delete_private_key': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const r = await this.axiosInstance.delete(`/security/keys/${args.uuid}`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }

          // ── GitHub Apps ────────────────────────────────────────────────────
          case 'list_github_apps': {
            const r = await this.axiosInstance.get('/github-apps');
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'create_github_app': {
            const r = await this.axiosInstance.post('/github-apps', args);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'delete_github_app': {
            if (args.github_app_id === undefined) throw new McpError(ErrorCode.InvalidParams, 'github_app_id is required');
            const r = await this.axiosInstance.delete(`/github-apps/${args.github_app_id}`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'list_github_app_repositories': {
            if (args.github_app_id === undefined) throw new McpError(ErrorCode.InvalidParams, 'github_app_id is required');
            const r = await this.axiosInstance.get(`/github-apps/${args.github_app_id}/repositories`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }

          // ── Cloud Tokens ───────────────────────────────────────────────────
          case 'list_cloud_tokens': {
            const r = await this.axiosInstance.get('/cloud-tokens');
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'create_cloud_token': {
            const r = await this.axiosInstance.post('/cloud-tokens', args);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'delete_cloud_token': {
            if (!args.uuid) throw new McpError(ErrorCode.InvalidParams, 'uuid is required');
            const r = await this.axiosInstance.delete(`/cloud-tokens/${args.uuid}`);
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }

          // ── Hetzner ────────────────────────────────────────────────────────
          case 'get_hetzner_locations': {
            const r = await this.axiosInstance.get('/hetzner/locations', { params: { cloud_provider_token_uuid: args.cloud_provider_token_uuid } });
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'get_hetzner_server_types': {
            const r = await this.axiosInstance.get('/hetzner/server-types', { params: { cloud_provider_token_uuid: args.cloud_provider_token_uuid } });
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'get_hetzner_images': {
            const r = await this.axiosInstance.get('/hetzner/images', { params: { cloud_provider_token_uuid: args.cloud_provider_token_uuid } });
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }
          case 'get_hetzner_ssh_keys': {
            const r = await this.axiosInstance.get('/hetzner/ssh-keys', { params: { cloud_provider_token_uuid: args.cloud_provider_token_uuid } });
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }

          // ── Resources ──────────────────────────────────────────────────────
          case 'list_resources': {
            const r = await this.axiosInstance.get('/resources');
            return { content: [{ type: 'text', text: JSON.stringify(r.data, null, 2) }] };
          }

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        if (error instanceof McpError) throw error;
        if (axios.isAxiosError(error)) {
          throw new McpError(
            ErrorCode.InternalError,
            `Coolify API error: ${error.response?.data?.message || error.response?.data?.error || error.message}`
          );
        }
        throw error;
      }
    });
  }

  async run() {
    const baseUrl = process.env.COOLIFY_BASE_URL;
    const token = process.env.COOLIFY_TOKEN;

    if (!baseUrl || !token) {
      throw new Error('COOLIFY_BASE_URL and COOLIFY_TOKEN environment variables are required');
    }

    this.initializeAxios({ baseUrl, token });
    this.setupToolHandlers();

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Coolify MCP Server v4.1.1 running on stdio');
  }
}

const server = new CoolifyServer();
server.run().catch(console.error);
