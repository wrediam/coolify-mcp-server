# Coolify MCP Server

<img src="graphics/CoolifyMCP.png" width="256" alt="Coolify MCP Logo" />

A Model Context Protocol (MCP) server providing full coverage of the **Coolify v4.3.1** REST API. Manage applications, databases, services, servers, deployments, and more — all from any MCP-compatible AI client.

<a href="https://glama.ai/mcp/servers/@wrediam/coolify-mcp-server">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@wrediam/coolify-mcp-server/badge" alt="Coolify Server MCP server" />
</a>

> **Compatibility:** Coolify v4.x. API base: `https://<your-coolify-instance>/api/v1`

Coolify v4.2.0 made state-changing endpoints POST-only; the former GET routes now
return `This endpoint has changed to a POST request.` This server issues POST for
all of them. Lifecycle and deploy operations remain compatible with earlier v4.x
releases, which accepted both methods. Three tools — `enable_api`, `disable_api`
and `validate_server` — call endpoints that were GET-only before v4.2.0 and so
require **Coolify v4.2.0 or newer**.

## Prerequisites

- Node.js 18 or higher
- A running Coolify v4 instance (v4.2.0+ for the three tools noted above)
- A Coolify API token (from **Security → API Tokens** in the dashboard)

## Installation

```bash
# Install globally
npm install -g coolify-mcp-server

# Or use with npx (no install needed)
npx coolify-mcp-server
```

## Configuration

Set two environment variables:

| Variable | Description |
|---|---|
| `COOLIFY_BASE_URL` | Base URL of your Coolify instance (e.g. `https://coolify.example.com`) |
| `COOLIFY_TOKEN` | Your Coolify API Bearer token |

### MCP Settings (Claude Desktop / Windsurf / Cline)

```json
{
  "mcpServers": {
    "coolify": {
      "command": "npx",
      "args": ["-y", "coolify-mcp-server"],
      "env": {
        "COOLIFY_BASE_URL": "https://your-coolify-instance",
        "COOLIFY_TOKEN": "your-api-token"
      }
    }
  }
}
```

**Windows users** (Cline/cmd):
```json
{
  "mcpServers": {
    "coolify": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "coolify-mcp-server"],
      "env": {
        "COOLIFY_BASE_URL": "https://your-coolify-instance",
        "COOLIFY_TOKEN": "your-api-token"
      }
    }
  }
}
```

## Available Tools

### General
- `get_version` — Get Coolify version
- `health_check` — API health check (no auth)
- `enable_api` / `disable_api` — Enable/disable the API (root token)
- `enable_mcp` / `disable_mcp` — Enable/disable built-in MCP endpoint (root token)

### Teams
- `list_teams`, `get_team`, `get_team_members`
- `get_current_team`, `get_current_team_members`

### Servers
- `list_servers`, `get_server`, `create_server`, `update_server`, `delete_server`
- `validate_server`, `get_server_resources`, `get_server_domains`
- `create_hetzner_server`

### Projects
- `list_projects`, `get_project`, `create_project`, `update_project`, `delete_project`

### Environments
- `list_environments`, `get_environment`, `create_environment`, `delete_environment`

### Applications
- `list_applications`, `get_application`
- `create_public_application`, `create_private_github_app_application`, `create_private_deploy_key_application`
- `create_dockerfile_application`, `create_dockerimage_application`
- `update_application`, `delete_application`
- `start_application`, `stop_application`, `restart_application`
- `get_application_logs`
- `list_application_envs`, `create_application_env`, `update_application_env`, `bulk_update_application_envs`, `delete_application_env`
- `list_application_storages`, `create_application_storage`, `delete_application_storage`
- `list_application_scheduled_tasks`, `create_application_scheduled_task`, `delete_application_scheduled_task`

> To create a resource from a raw Docker Compose file, use `create_service` with
> `docker_compose_raw`. Coolify has no application-level compose creation endpoint.

### Databases
- `list_databases`, `get_database`, `update_database`, `delete_database`
- `create_postgresql_database`, `create_mysql_database`, `create_mariadb_database`, `create_mongodb_database`
- `create_redis_database`, `create_keydb_database`, `create_dragonfly_database`, `create_clickhouse_database`
- `start_database`, `stop_database`, `restart_database`
- `get_database_backups`, `create_database_backup`, `list_database_backup_executions`
- `list_database_envs`, `create_database_env`, `delete_database_env`

### Services
- `list_services`, `get_service`, `create_service`, `update_service`, `delete_service`
- `start_service`, `stop_service`, `restart_service`
- `list_service_envs`, `create_service_env`, `delete_service_env`
- `list_service_scheduled_tasks`, `create_service_scheduled_task`, `delete_service_scheduled_task`

### Deployments
- `list_deployments`, `get_deployment`, `cancel_deployment`
- `list_deployments_by_application`, `deploy_by_tag_or_uuid`

### Private Keys
- `list_private_keys`, `get_private_key`, `create_private_key`, `update_private_key`, `delete_private_key`

### GitHub Apps
- `list_github_apps`, `create_github_app`, `delete_github_app`, `list_github_app_repositories`

### Cloud Tokens
- `list_cloud_tokens`, `create_cloud_token`, `delete_cloud_token`

### Hetzner
- `get_hetzner_locations`, `get_hetzner_server_types`, `get_hetzner_images`, `get_hetzner_ssh_keys`
- `create_hetzner_server`

### Resources
- `list_resources` — All resources across the instance

## License

MIT