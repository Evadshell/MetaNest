"use client";
import { useUser } from '@auth0/nextjs-auth0';
import { useState, useEffect } from 'react';
import { getGithubData, getRepositories } from '@/lib/github';

export default function Workspace() {
    const { user, isLoading } = useUser();
    const [repositories, setRepositories] = useState([]);
    const [activeRepo, setActiveRepo] = useState(null);

    useEffect(() => {
        async function fetchGithubData() {
            if (user?.githubAccessToken) {
                const repos = await getRepositories(user.githubAccessToken);
                setRepositories(repos);
            }
        }
        fetchGithubData();
    }, [user]);

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="flex h-screen">
            {/* Sidebar with repository list */}
            <div className="w-64 bg-gray-100 p-4">
                <h2 className="text-xl font-bold mb-4">Repositories</h2>
                <ul>
                    {repositories.map((repo) => (
                        <li
                            key={repo.id}
                            className={`p-2 cursor-pointer rounded ${
                                activeRepo?.id === repo.id ? 'bg-blue-100' : ''
                            }`}
                            onClick={() => setActiveRepo(repo)}
                        >
                            {repo.name}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Main content area */}
            <div className="flex-1 p-6">
                {activeRepo ? (
                    <div>
                        <h1 className="text-2xl font-bold mb-4">{activeRepo.full_name}</h1>
                        <p className="text-gray-600 mb-4">{activeRepo.description}</p>
                        <div className="flex space-x-4">
                            <a
                                href={activeRepo.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-500 text-white px-4 py-2 rounded"
                            >
                                View on GitHub
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-500">
                        Select a repository to view details
                    </div>
                )}
            </div>
        </div>
    );
}
