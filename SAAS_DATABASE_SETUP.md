# SaaS Database Setup Documentation

## Overview

The `setup-saas-database.sh` script is a specialized version of the original `setup-database.sh` that creates a multi-tenant database infrastructure for the AI HR Bot SaaS system.

## Key Differences from Original Setup

### Database Schema Changes

| Feature | Original | SaaS Version |
|---------|----------|--------------|
| **Primary Keys** | SERIAL (integer) | UUID with uuid_generate_v4() |
| **Tenant Isolation** | None | Complete with Row-Level Security |
| **User Management** | Single system | Multi-tenant with roles |
| **Data Isolation** | None | tenant_id foreign keys on all tables |
| **Security** | Basic | RLS policies + audit logging |

### New SaaS-Specific Tables

1. **`tenants`** - Master tenant registry
   - Tenant management, status, plan types
   - Subdomain and domain management

2. **`users`** - SaaS platform users
   - Multi-tenant user authentication
   - Role-based access control (owner, admin, viewer)
   - Email verification and password reset

3. **`tenant_configurations`** - Tenant-specific settings
   - Encrypted configuration storage
   - Category-based organization

4. **`subscriptions`** - Billing and subscription management
   - Stripe integration support
   - Plan types and billing cycles

5. **`usage_metrics`** - Usage tracking and analytics
   - LLM calls, storage, processing metrics
   - Period-based tracking

6. **`audit_logs`** - Security and compliance logging
   - All user actions and data changes
   - IP address and user agent tracking

### Enhanced Existing Tables

All original tables (`vacancies`, `candidates`, `dialogues`, `evaluations`, `interview_results`, `prompt_settings`) have been enhanced with:

- **UUID primary keys** for better scalability
- **tenant_id foreign keys** for data isolation
- **Row-Level Security policies** for automatic tenant filtering
- **Additional metadata fields** for extensibility
- **User tracking fields** (created_by, evaluated_by, etc.)

### Row-Level Security (RLS)

Every tenant-aware table has RLS enabled with policies that:
- Automatically filter data by current tenant context
- Prevent cross-tenant data access
- Use `current_tenant_id()` function for context

### Security Features

- **Tenant Context Management**: `set_tenant_context()` and `current_tenant_id()` functions
- **Encrypted Storage**: Support for encrypted tenant configurations
- **Audit Trail**: Comprehensive logging of all tenant actions
- **Data Isolation**: Complete separation of tenant data

## Usage

### Basic Setup
```bash
./setup-saas-database.sh
```

### Non-Interactive Setup
```bash
./setup-saas-database.sh --non-interactive --db-password your_password
```

### Custom Configuration
```bash
./setup-saas-database.sh --db-name my_hr_saas --db-user saas_admin
```

## Environment Configuration

The script creates `.env.saas` file with SaaS-specific configuration:

### Database Settings
- Multi-tenant database connection parameters
- Connection pooling optimized for SaaS

### Authentication & Security
- JWT configuration for tenant-aware authentication
- Redis for session management
- Bcrypt for password hashing

### Stripe Integration
- Subscription and billing management
- Webhook handling for payment events

### Default LLM Configuration
- Per-tenant LLM provider settings
- Usage tracking and limits

## Default Data

The script creates:

1. **System Tenant** (`00000000-0000-0000-0000-000000000000`)
   - Used for system-wide configurations
   - Default prompt templates
   - System settings

2. **Default Prompt Templates**
   - CV analysis prompts
   - Resume analysis prompts  
   - Interview conversation prompts

3. **System Settings**
   - Plan limits (candidates, LLM calls)
   - Default LLM configurations

## Next Steps After Setup

1. **Configure Stripe**
   - Set up your Stripe secret keys
   - Configure webhook endpoints
   - Set up pricing plans

2. **Set up Redis**
   - Install and configure Redis for sessions
   - Update Redis URL in `.env.saas`

3. **Configure Email**
   - Set up SMTP settings for notifications
   - Configure email templates

4. **Create First Tenant**
   - Use the tenant creation scripts
   - Set up admin user
   - Configure tenant settings

## Security Considerations

- **Tenant Isolation**: Complete data separation using RLS
- **Audit Logging**: All actions are logged for compliance
- **Encrypted Storage**: Sensitive data is encrypted at rest
- **Access Control**: Role-based permissions within tenants
- **Session Security**: Redis-based secure session management

## Monitoring and Maintenance

- **Usage Tracking**: Monitor tenant resource usage
- **Performance**: Database indexes optimized for multi-tenant queries
- **Backup**: Tenant-aware backup and recovery procedures
- **Scaling**: Designed for horizontal scaling

## Troubleshooting

### Common Issues

1. **PostgreSQL Extensions**
   - Ensure `uuid-ossp` and `pgcrypto` extensions are available
   - May require superuser privileges to install

2. **RLS Policies**
   - Verify tenant context is set before queries
   - Check `current_tenant_id()` returns expected value

3. **Performance**
   - Monitor query performance with multi-tenant indexes
   - Consider partitioning for very large datasets

### Useful Commands

```bash
# Test database connection
npx tsx src/database/saas-test.ts

# Create demo tenant
npx tsx scripts/create-demo-tenant.ts

# List all tenants
npx tsx scripts/list-tenants.ts

# View tenant usage
npx tsx scripts/tenant-usage.ts [tenant-id]
```

## Migration from Single-Tenant

If migrating from the original single-tenant setup:

1. **Data Migration**: Use migration scripts to add tenant_id to existing data
2. **UUID Migration**: Convert existing SERIAL IDs to UUIDs
3. **User Creation**: Create tenant and user records for existing data
4. **Configuration**: Move system settings to tenant-specific settings

## Compliance

The SaaS setup includes features for:
- **GDPR Compliance**: Data export, deletion, and anonymization
- **Audit Requirements**: Comprehensive action logging
- **Data Retention**: Configurable retention policies
- **Privacy Controls**: Tenant-specific privacy settings
