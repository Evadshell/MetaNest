export function Leaderboard({ members, spaceId }) {
    const sortedMembers = [...members].sort((a, b) => b.points - a.points);
    
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
        <div className="space-y-2">
          {sortedMembers.map((member, index) => (
            <div 
              key={member.userId}
              className={`flex items-center justify-between p-3 rounded ${
                index === 0 ? 'bg-yellow-50' :
                index === 1 ? 'bg-gray-50' :
                index === 2 ? 'bg-orange-50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-bold w-6">{index + 1}</span>
                <img 
                  src={member.picture} 
                  alt={member.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="font-medium">{member.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{member.points}</span>
                <span className="text-sm text-gray-500">points</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  