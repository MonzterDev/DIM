import angular from 'angular';

angular.module('dim-oauth')
  .service('http-refresh-token', HttpRefreshTokenService);

/**
 * This is an interceptor for the $http service that watches for missing or expired
 * OAuth tokens and attempts to acquire them.
 */
function HttpRefreshTokenService($rootScope, $q, $injector, OAuthService, OAuthTokenService) {
  'ngInject';

  const service = this;
  let cache = null;
  const matcher = /www\.bungie\.net\/Platform\/(User|Destiny)\//;

  service.request = requestHandler;

  function requestHandler(config) {
    config.headers = config.headers || {};

    if (config.url.match(matcher)) {
      if (!config.headers.hasOwnProperty('Authorization')) {
        if (OAuthService.isAuthenticated()) {
          let isValid = isTokenValid(OAuthTokenService.getAccessToken());

          if (isValid) {
            config.headers.Authorization = OAuthTokenService.getAuthorizationHeader();
          } else {
            isValid = isTokenValid(OAuthTokenService.getRefreshToken());

            if (isValid) {
              if (!cache) {
                cache = OAuthService.refreshToken();
              }

              return cache
                .then(function() {
                  console.log("Successfully updated auth token from refresh token.");
                  config.headers.Authorization = OAuthTokenService.getAuthorizationHeader();
                  return config;
                })
                .catch(handleRefreshTokenError)
                .finally(() => {
                  cache = null;
                });
            } else {
              console.warn("Refresh token invalid, clearing auth tokens & going to login");
              OAuthTokenService.removeToken();
              $rootScope.$broadcast('dim-no-token-found');
            }
          }
        } else {
          console.warn("No auth token exists, redirect to login");
          OAuthTokenService.removeToken();
          $rootScope.$broadcast('dim-no-token-found');
        }
      }
    }

    return config;
  }

  function handleRefreshTokenError(response) {
    if (response.status === -1) {
      console.warn("Error getting auth token from refresh token because there's no internet connection. Not clearing token.", response);
    } else if (response.data && response.data.ErrorCode) {
      if (response.data.ErrorCode === 2110 /* RefreshTokenNotYetValid */ ||
          response.data.ErrorCode === 2111 /* AccessTokenHasExpired */) {
        console.warn("Refresh token expired or not valid, clearing auth tokens & going to login", response);
        OAuthTokenService.removeToken();
        $rootScope.$broadcast('dim-no-token-found');
      }
    } else {
      console.warn("Other error getting auth token from refresh token. Not clearing auth tokens", response);
    }
    // TODO: Localize this error? Does it get displayed?
    throw new Error("Error getting auth token from refresh token");
  }

  function isTokenValid(token) {
    const expired = OAuthTokenService.hasTokenExpired(token);
    const isReady = OAuthTokenService.isTokenReady(token);

    return (!expired && isReady);
  }
}
