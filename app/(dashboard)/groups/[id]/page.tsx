import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getGroupByIdService, getGroupMembersService } from '@/services/group.service'
import { getExpensesByGroupService, getGroupSettlementsService } from '@/services/expense.service'
import GroupHeader from '@/components/group-header'
import GroupMembers from '@/components/group-members'
import ExpensesList from '@/components/expenses-list'
import SettlementsList from '@/components/settlements-list'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect('/sign-in')
  }

  const group = await getGroupByIdService(id, session.user.id)
  const members = await getGroupMembersService(id)
  const expenses = await getExpensesByGroupService(id)
  const settlements = await getGroupSettlementsService(id)

  const safeExpenses = expenses.map(e => ({
    ...e,
    amount: e.amount.toString(),
    splits: e.splits.map(s => ({
      ...s,
      splitAmount: s.splitAmount.toString()
    }))
  }))

  const safeSettlements = settlements.map(s => ({
    ...s,
    amount: s.amount.toString()
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <GroupHeader group={group} currentUserId={session.user.id} />

      {/* Content */}
      <div>
        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-card border border-border">
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="settlements">Settlements</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-6">
            <ExpensesList 
              groupId={id} 
              expenses={safeExpenses} 
              members={members} 
              currentUserId={session.user.id}
              groupOwnerId={group.userId}
            />
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <GroupMembers 
              groupId={id} 
              members={members} 
              currentUserId={session.user.id}
              groupOwnerId={group.userId}
            />
          </TabsContent>

          <TabsContent value="settlements" className="space-y-6">
            <SettlementsList
              settlements={safeSettlements}
              groupId={id}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
