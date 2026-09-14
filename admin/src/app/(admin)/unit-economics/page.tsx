import { loadSavedWorkspace } from '@/application/use-cases';
import { requireAdminContext, withSession } from '@/infrastructure/container';
import { UnitEconomicsWorkbench } from '@/presentation/components/UnitEconomicsWorkbench';

export default async function UnitEconomicsPage() {
  const { gateway } = await requireAdminContext();
  // Сохранённая модель приходит с сервера: новый браузер и новый админ
  // открывают ту же картину, а не заводские ориентиры.
  const saved = await withSession(() => loadSavedWorkspace(gateway));

  return (
    <>
      <h1 className="page-title">Юнит-экономика</h1>
      <p className="page-lede">
        Что остаётся с одной подписки после налога с продажи, комиссии канала,
        себестоимости и налога на прибыль — и во что это складывается за три
        года. Модель чистая: те же функции считают и здесь, и в любом отчёте.
      </p>
      <UnitEconomicsWorkbench saved={saved} />
    </>
  );
}
