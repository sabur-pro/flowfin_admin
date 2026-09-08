import { UnitEconomicsWorkbench } from '@/presentation/components/UnitEconomicsWorkbench';

export default function UnitEconomicsPage() {
  return (
    <>
      <h1 className="page-title">Юнит-экономика</h1>
      <p className="page-lede">
        Что остаётся с одной подписки после налога с продажи, комиссии канала,
        себестоимости и налога на прибыль — и во что это складывается за три
        года. Модель чистая: те же функции считают и здесь, и в любом отчёте.
      </p>
      <UnitEconomicsWorkbench />
    </>
  );
}
