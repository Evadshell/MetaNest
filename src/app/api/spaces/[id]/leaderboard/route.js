export async function GET(req, { params }) {
    try {
      const session = await getSession();
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
  
      const space = await Space.findOne({ id: params.id });
      if (!space) {
        return NextResponse.json({ error: 'Space not found' }, { status: 404 });
      }
  
      const leaderboard = space.members
        .map(member => ({
          userId: member.userId,
          name: member.name,
          picture: member.picture,
          points: member.points
        }))
        .sort((a, b) => b.points - a.points);
  
      return NextResponse.json(leaderboard);
    } catch (error) {
      console.error('Get leaderboard error:', error);
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }
  }