export async function getGithubData(accessToken) {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    };
  
    const response = await fetch('https://api.github.com/user', { headers });
    return response.json();
  }
  
  export async function getRepositories(accessToken) {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    };
  
    const response = await fetch('https://api.github.com/user/repos', { headers });
    return response.json();
  }