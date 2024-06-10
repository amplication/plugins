using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.Filters;

namespace ServiceName.APIs;

public static class ProgramAuthExtensions
{
    public static void AddApiAuthentication(this IServiceCollection services)
    {
        services.AddAuthorization();
        services
            .AddIdentityApiEndpoints<IdentityUser>()
            .AddRoles<IdentityRole>()
            .AddEntityFrameworkStores<ServiceNameDbContext>();
    }

    public static void UseApiAuthentication(this WebApplication app)
    {
        app.MapGroup($"/auth").MapIdentityApi<IdentityUser>();
        app.UseAuthorization();
    }

    public static void UseOpenApiAuthentication(
        this Swashbuckle.AspNetCore.SwaggerGen.SwaggerGenOptions options
    )
    {
        options.TagActionsBy(api =>
        {
            string? tag = null;
            if (api.ActionDescriptor is ControllerActionDescriptor controllerActionDescriptor)
            {
                tag = controllerActionDescriptor.ControllerName;
            }
            tag = tag ?? api.RelativePath?.Split('/')?.FirstOrDefault();
            return new[] { tag };
        });

        options.AddSecurityDefinition(
            "oauth2",
            new OpenApiSecurityScheme
            {
                In = ParameterLocation.Header,
                Name = "Authorization",
                Scheme = "bearer",
                Type = SecuritySchemeType.Http,
            }
        );
        options.OperationFilter<SecurityRequirementsOperationFilter>();
    }
}