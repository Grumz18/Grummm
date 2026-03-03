FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY Grummm.sln ./
COPY platform/backend/src/ platform/backend/src/
RUN dotnet restore platform/backend/src/WebAPI/WebAPI.csproj
RUN dotnet publish platform/backend/src/WebAPI/WebAPI.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-pip libpython3.11 \
    && rm -rf /var/lib/apt/lists/*

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "WebAPI.dll"]
