using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

namespace Platform.Core.Contracts.Modules;

public interface IModule
{
    void RegisterServices(IServiceCollection services);
    void MapEndpoints(IEndpointRouteBuilder app);
}
